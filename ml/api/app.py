from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import time
import logging
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
import numpy as np
from PIL import Image
import io
import base64
import traceback

# ===================================================
# 🔒 DETERMINISTIC SETUP - MUST BE BEFORE TORCH IMPORT
# ===================================================
import random
random.seed(42)

import numpy as np
np.random.seed(42)

# Set environment variables for deterministic behavior
os.environ['PYTHONHASHSEED'] = '42'
os.environ['CUBLAS_WORKSPACE_CONFIG'] = ':4096:8'

# Import our ML modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.tumor_predictor import TumorPredictor
from utils.image_utils import validate_image_format, get_image_info, enhance_medical_image
from utils.data_manager import DataManager, save_prediction_report, validate_prediction_data
from config.config import get_config, ERROR_MESSAGES

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load configuration
config = get_config(os.getenv('FLASK_ENV', 'development'))
config.create_directories()

# Configure Flask app
app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = config.UPLOADS_DIR

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(config.LOGS_DIR / 'ml_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize components
predictor = None
data_manager = DataManager(str(config.DATABASE_PATH))

def convert_numpy_types(obj):
    """Convert NumPy types to Python native types for JSON serialization."""
    if hasattr(obj, 'item'):  # NumPy scalar
        return obj.item()
    elif hasattr(obj, 'tolist'):  # NumPy array
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj

def initialize_model():
    """Initialize the tumor prediction model."""
    global predictor
    try:
        # ===================================================
        # 🔒 PYTORCH DETERMINISTIC SETUP
        # ===================================================
        import torch
        torch.manual_seed(42)
        torch.cuda.manual_seed_all(42)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
        torch.set_grad_enabled(False)  # Disable gradients for inference
        
        # Use deterministic algorithms when available
        try:
            torch.use_deterministic_algorithms(True)
            logger.info("✅ PyTorch deterministic algorithms enabled")
        except Exception as det_error:
            logger.warning(f"⚠️ Could not enable deterministic algorithms: {det_error}")
        
        predictor = TumorPredictor()
        
        # Check if pre-trained model exists
        if os.path.exists(config.PRETRAINED_MODEL_PATH):
            predictor.load_model(str(config.PRETRAINED_MODEL_PATH))
            logger.info("Pre-trained model loaded successfully")
        else:
            # Build and use the base model (requires training)
            predictor.build_model()
            logger.warning("Using untrained model. Please train the model before production use.")
        
        # Ensure model is in evaluation mode
        try:
            predictor.model.eval()
            logger.info("✅ Model set to evaluation mode for deterministic inference")
        except Exception as eval_error:
            logger.warning(f"⚠️ Could not set model to eval mode: {eval_error}")
        
        return True
    except Exception as e:
        logger.error(f"Failed to initialize model: {str(e)}")
        return False

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    """Handle file too large error."""
    return jsonify({
        'success': False,
        'error': ERROR_MESSAGES['image_too_large']
    }), 413

@app.errorhandler(500)
def handle_internal_error(e):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({
        'success': False,
        'error': ERROR_MESSAGES['unknown_error']
    }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    global predictor
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor is not None,
        'timestamp': time.time()
    })

@app.route('/predict', methods=['POST'])
def predict_tumor():
    """Predict tumor from uploaded image."""
    global predictor
    
    try:
        # Check if model is loaded
        if predictor is None:
            return jsonify({
                'success': False,
                'error': ERROR_MESSAGES['model_not_loaded']
            }), 500
        
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': ERROR_MESSAGES['invalid_image_format']
            }), 400
        
        # Get optional parameters
        user_id = request.form.get('user_id')
        enhance_image = request.form.get('enhance_image', 'false').lower() == 'true'
        save_result = request.form.get('save_result', 'true').lower() == 'true'
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = str(int(time.time()))
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(config.UPLOADS_DIR, filename)
        file.save(filepath)
        
        logger.info(f"Processing image: {filename}")
        start_time = time.time()
        
        try:
            # Load and preprocess image
            image = Image.open(filepath)
            image_array = np.array(image.convert('RGB'))
            
            # Apply enhancement if requested
            if enhance_image:
                image_array = enhance_medical_image(image_array)
            
            # Make prediction
            prediction_result = predictor.predict(image_array)
            processing_time = time.time() - start_time
            
            # Validate prediction result
            if not validate_prediction_data(prediction_result):
                raise ValueError("Invalid prediction result")
            
            # Get image info
            image_info = get_image_info(filepath)
            
            # Prepare response
            response_data = {
                'success': True,
                'prediction': prediction_result,
                'image_info': {
                    'filename': filename,
                    'size': image_info.get('size', 'Unknown'),
                    'format': image_info.get('format', 'Unknown')
                },
                'processing_time': round(processing_time, 3),
                'timestamp': time.time(),
                'model_version': 'ResNet50_v1'
            }
            
            # Save to database if requested
            if save_result:
                try:
                    record_id = data_manager.save_prediction(
                        filepath, 
                        prediction_result, 
                        user_id=user_id,
                        processing_time=processing_time
                    )
                    response_data['record_id'] = record_id
                except Exception as e:
                    logger.warning(f"Failed to save prediction to database: {str(e)}")
            
            logger.info(f"Prediction completed: {prediction_result['predicted_class']} "
                       f"({prediction_result['confidence']:.3f}) in {processing_time:.3f}s")
            
            # Convert NumPy types to JSON-serializable types
            response_data = convert_numpy_types(response_data)
            
            return jsonify(response_data)
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return jsonify({
                'success': False,
                'error': ERROR_MESSAGES['prediction_failed'],
                'details': str(e) if app.debug else None
            }), 500
            
        finally:
            # Clean up uploaded file
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception as e:
                logger.warning(f"Failed to cleanup file {filepath}: {str(e)}")
    
    except Exception as e:
        logger.error(f"Request processing failed: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': ERROR_MESSAGES['unknown_error'],
            'details': str(e) if app.debug else None
        }), 500

@app.route('/predict_base64', methods=['POST'])
def predict_tumor_base64():
    """Predict tumor from base64 encoded image."""
    global predictor
    
    try:
        # Check if model is loaded
        if predictor is None:
            return jsonify({
                'success': False,
                'error': ERROR_MESSAGES['model_not_loaded']
            }), 500
        
        # Get JSON data
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No base64 image data provided'
            }), 400
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(data['image'])
            image = Image.open(io.BytesIO(image_data))
            image_array = np.array(image.convert('RGB'))
        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Invalid base64 image data'
            }), 400
        
        # Get optional parameters
        user_id = data.get('user_id')
        enhance_image = data.get('enhance_image', False)
        
        logger.info("Processing base64 image")
        start_time = time.time()
        
        # Apply enhancement if requested
        if enhance_image:
            image_array = enhance_medical_image(image_array)
        
        # Make prediction
        prediction_result = predictor.predict(image_array)
        processing_time = time.time() - start_time
        
        # Prepare response
        response_data = {
            'success': True,
            'prediction': prediction_result,
            'processing_time': round(processing_time, 3),
            'timestamp': time.time(),
            'model_version': 'ResNet50_v1'
        }
        
        logger.info(f"Base64 prediction completed: {prediction_result['predicted_class']} "
                   f"({prediction_result['confidence']:.3f}) in {processing_time:.3f}s")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Base64 prediction failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': ERROR_MESSAGES['prediction_failed'],
            'details': str(e) if app.debug else None
        }), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict multiple images at once."""
    global predictor
    
    try:
        if predictor is None:
            return jsonify({
                'success': False,
                'error': ERROR_MESSAGES['model_not_loaded']
            }), 500
        
        if 'images' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image files provided'
            }), 400
        
        files = request.files.getlist('images')
        if len(files) > config.MAX_BATCH_SIZE:
            return jsonify({
                'success': False,
                'error': f'Too many files. Maximum batch size: {config.MAX_BATCH_SIZE}'
            }), 400
        
        user_id = request.form.get('user_id')
        enhance_images = request.form.get('enhance_images', 'false').lower() == 'true'
        
        results = []
        start_time = time.time()
        
        for file in files:
            if file.filename == '' or not allowed_file(file.filename):
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'error': 'Invalid file'
                })
                continue
            
            try:
                # Process individual image
                image = Image.open(file.stream)
                image_array = np.array(image.convert('RGB'))
                
                if enhance_images:
                    image_array = enhance_medical_image(image_array)
                
                prediction_result = predictor.predict(image_array)
                
                # Convert NumPy types to JSON-serializable types
                prediction_result = convert_numpy_types(prediction_result)
                
                results.append({
                    'filename': file.filename,
                    'success': True,
                    'prediction': prediction_result
                })
                
            except Exception as e:
                logger.error(f"Failed to process {file.filename}: {str(e)}")
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'error': str(e)
                })
        
        total_time = time.time() - start_time
        
        return jsonify({
            'success': True,
            'results': results,
            'total_images': len(files),
            'successful_predictions': sum(1 for r in results if r['success']),
            'total_processing_time': round(total_time, 3)
        })
        
    except Exception as e:
        logger.error(f"Batch prediction failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': ERROR_MESSAGES['unknown_error'],
            'details': str(e) if app.debug else None
        }), 500

@app.route('/history', methods=['GET'])
def get_prediction_history():
    """Get prediction history."""
    try:
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 100))
        
        predictions = data_manager.get_predictions(user_id=user_id, limit=limit)
        stats = data_manager.get_prediction_stats(user_id=user_id)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Failed to get history: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve prediction history'
        }), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get prediction statistics."""
    try:
        user_id = request.args.get('user_id')
        stats = data_manager.get_prediction_stats(user_id=user_id)
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve statistics'
        }), 500

@app.route('/model_info', methods=['GET'])
def get_model_info():
    """Get model information."""
    global predictor
    
    try:
        if predictor is None:
            return jsonify({
                'success': False,
                'error': ERROR_MESSAGES['model_not_loaded']
            }), 500
        
        info = {
            'success': True,
            'model_type': 'ResNet50',
            'input_shape': config.MODEL_INPUT_SIZE,
            'classes': config.MODEL_CLASSES,
            'num_classes': config.NUM_CLASSES,
            'version': 'v1.0',
            'description': 'Pre-trained ResNet50 model fine-tuned for tumor detection'
        }
        
        return jsonify(info)
        
    except Exception as e:
        logger.error(f"Failed to get model info: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve model information'
        }), 500

if __name__ == '__main__':
    # Initialize model
    if initialize_model():
        logger.info("Starting ML API server...")
        app.run(
            host=config.API_HOST,
            port=config.API_PORT,
            debug=config.API_DEBUG
        )
    else:
        logger.error("Failed to initialize model. Exiting.")
        exit(1)
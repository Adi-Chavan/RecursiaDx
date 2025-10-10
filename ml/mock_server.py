from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random
import uuid

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': True,
        'service': 'Mock ML API',
        'version': 'mock-1.0.0',
        'timestamp': time.time()
    })

@app.route('/model_info', methods=['GET'])
def model_info():
    return jsonify({
        'model_name': 'ResNet50-TumorClassifier',
        'model_version': '1.0.0',
        'input_shape': [224, 224, 3],
        'classes': ['benign', 'malignant'],
        'accuracy': 0.94
    })

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    confidence = random.uniform(0.7, 0.99)
    is_malignant = random.choice([True, False])
    
    return jsonify({
        'success': True,
        'prediction': {
            'filename': file.filename,
            'prediction': 'malignant' if is_malignant else 'benign',
            'confidence': round(confidence, 4),
            'risk_assessment': 'high' if is_malignant and confidence > 0.8 else 'medium',
            'processing_time': round(random.uniform(0.5, 2.0), 2),
            'image_id': str(uuid.uuid4())
        },
        'metadata': {
            'model_version': 'mock-1.0.0',
            'timestamp': time.time()
        }
    })

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    files = request.files.getlist('images')
    predictions = []
    
    for file in files:
        if file.filename:
            confidence = random.uniform(0.7, 0.99)
            is_malignant = random.choice([True, False])
            predictions.append({
                'filename': file.filename,
                'prediction': 'malignant' if is_malignant else 'benign',
                'confidence': round(confidence, 4),
                'risk_assessment': 'high' if is_malignant and confidence > 0.8 else 'medium',
                'processing_time': round(random.uniform(0.5, 2.0), 2),
                'image_id': str(uuid.uuid4())
            })
    
    return jsonify({
        'success': True,
        'predictions': predictions,
        'summary': {
            'total_images': len(predictions),
            'malignant_count': sum(1 for p in predictions if p['prediction'] == 'malignant'),
            'benign_count': sum(1 for p in predictions if p['prediction'] == 'benign')
        }
    })

if __name__ == '__main__':
    print("Starting RecursiaDx Mock ML API Server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)

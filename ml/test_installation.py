"""
Test script to verify ML module installation and basic functionality.
"""

import os
import sys
import numpy as np
from PIL import Image
import tempfile

# Add ML module to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all modules can be imported."""
    print("Testing imports...")
    
    try:
        from models.tumor_predictor import TumorPredictor
        print("✅ TumorPredictor imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import TumorPredictor: {e}")
        return False
    
    try:
        from utils.image_utils import load_and_preprocess_image, validate_image_format
        print("✅ Image utilities imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import image utilities: {e}")
        return False
    
    try:
        from utils.data_manager import DataManager
        print("✅ DataManager imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import DataManager: {e}")
        return False
    
    try:
        from config.config import get_config
        print("✅ Configuration imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import configuration: {e}")
        return False
    
    return True

def test_model_creation():
    """Test if the model can be created."""
    print("\nTesting model creation...")
    
    try:
        from models.tumor_predictor import TumorPredictor
        predictor = TumorPredictor()
        model = predictor.build_model()
        print("✅ Model created successfully")
        print(f"   Input shape: {model.input_shape}")
        print(f"   Output shape: {model.output_shape}")
        return True
    except Exception as e:
        print(f"❌ Failed to create model: {e}")
        return False

def test_config():
    """Test configuration loading."""
    print("\nTesting configuration...")
    
    try:
        from config.config import get_config
        config = get_config('development')
        print("✅ Configuration loaded successfully")
        print(f"   Model input size: {config.MODEL_INPUT_SIZE}")
        print(f"   Classes: {config.MODEL_CLASSES}")
        return True
    except Exception as e:
        print(f"❌ Failed to load configuration: {e}")
        return False

def test_image_processing():
    """Test image processing utilities."""
    print("\nTesting image processing...")
    
    try:
        from utils.image_utils import validate_image_format, enhance_medical_image
        
        # Test format validation
        valid_formats = ['test.jpg', 'test.png', 'test.tiff']
        invalid_formats = ['test.txt', 'test.doc']
        
        for fmt in valid_formats:
            if not validate_image_format(fmt):
                print(f"❌ Format validation failed for {fmt}")
                return False
        
        for fmt in invalid_formats:
            if validate_image_format(fmt):
                print(f"❌ Format validation should have failed for {fmt}")
                return False
        
        print("✅ Image format validation working correctly")
        
        # Test image enhancement
        test_image = np.random.rand(224, 224, 3).astype(np.float32)
        enhanced = enhance_medical_image(test_image)
        
        if enhanced.shape != test_image.shape:
            print("❌ Image enhancement changed image shape")
            return False
        
        print("✅ Image enhancement working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Image processing test failed: {e}")
        return False

def test_data_manager():
    """Test data manager functionality."""
    print("\nTesting data manager...")
    
    try:
        from utils.data_manager import DataManager, validate_prediction_data
        
        # Test with temporary database
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            db_path = tmp.name
        
        try:
            dm = DataManager(db_path)
            print("✅ DataManager initialized successfully")
            
            # Test prediction data validation
            valid_prediction = {
                'predicted_class': 'Tumor',
                'confidence': 0.85,
                'is_tumor': True,
                'probabilities': {
                    'non_tumor': 0.15,
                    'tumor': 0.85
                },
                'risk_level': 'High Risk'
            }
            
            if not validate_prediction_data(valid_prediction):
                print("❌ Valid prediction data validation failed")
                return False
            
            print("✅ Prediction data validation working correctly")
            
            # Test saving prediction
            record_id = dm.save_prediction(
                "test_image.jpg", 
                valid_prediction, 
                user_id="test_user"
            )
            
            if record_id is None:
                print("❌ Failed to save prediction")
                return False
            
            print("✅ Prediction saving working correctly")
            
            # Test retrieving predictions
            predictions = dm.get_predictions(user_id="test_user")
            if len(predictions) != 1:
                print("❌ Failed to retrieve predictions")
                return False
            
            print("✅ Prediction retrieval working correctly")
            
        finally:
            # Cleanup
            if os.path.exists(db_path):
                os.unlink(db_path)
        
        return True
        
    except Exception as e:
        print(f"❌ Data manager test failed: {e}")
        return False

def test_prediction_with_dummy_image():
    """Test prediction with a dummy image."""
    print("\nTesting prediction with dummy image...")
    
    try:
        from models.tumor_predictor import TumorPredictor
        
        # Create dummy image
        dummy_image = np.random.rand(224, 224, 3).astype(np.float32)
        
        # Initialize predictor
        predictor = TumorPredictor()
        predictor.build_model()
        
        # Make prediction
        result = predictor.predict(dummy_image)
        
        # Validate result structure
        required_keys = ['predicted_class', 'confidence', 'is_tumor', 'probabilities', 'risk_level']
        for key in required_keys:
            if key not in result:
                print(f"❌ Missing key in prediction result: {key}")
                return False
        
        print("✅ Prediction with dummy image successful")
        print(f"   Predicted class: {result['predicted_class']}")
        print(f"   Confidence: {result['confidence']:.3f}")
        print(f"   Risk level: {result['risk_level']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 RecursiaDx ML Module Test Suite")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_config,
        test_image_processing,
        test_data_manager,
        test_model_creation,
        test_prediction_with_dummy_image
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                print("❌ Test failed")
        except Exception as e:
            print(f"❌ Test crashed: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ML module is ready to use.")
        return 0
    else:
        print("⚠️ Some tests failed. Please check the installation.")
        return 1

if __name__ == "__main__":
    exit(main())
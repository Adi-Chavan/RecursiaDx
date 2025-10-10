import requests
import json

def test_ml_server():
    """Test ML server basic functionality"""
    print("🧪 Testing ML Server API Endpoints")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return
    
    # Test predict endpoint with a small dummy image
    try:
        # Create a small test image
        from PIL import Image
        import io
        import os
        
        # Create a 100x100 RGB image
        img = Image.new('RGB', (100, 100), color='red')
        
        # Save to memory
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        
        # Make prediction request
        files = {'image': ('test.jpg', img_buffer, 'image/jpeg')}
        data = {
            'enhance': 'false',
            'generate_heatmap': 'true'
        }
        
        print("\n🔍 Testing /predict endpoint...")
        response = requests.post(f"{base_url}/predict", files=files, data=data)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Prediction successful!")
            print(f"   Model loaded: {result.get('model_info', {}).get('model_loaded', 'Unknown')}")
            print(f"   Prediction: {result.get('prediction', 'N/A')}")
            print(f"   Probability: {result.get('probability', 'N/A')}")
        else:
            print(f"   ❌ Prediction failed: {response.status_code}")
            try:
                error_info = response.json()
                print(f"   Error: {error_info}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ Prediction Test Failed: {e}")

if __name__ == "__main__":
    test_ml_server()
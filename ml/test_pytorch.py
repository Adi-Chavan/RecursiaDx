#!/usr/bin/env python3
"""
Test script to verify PyTorch installation and basic functionality.
"""

import sys
import torch
import torchvision
import numpy as np
from PIL import Image

def test_pytorch_installation():
    """Test PyTorch installation and basic operations."""
    print("🔍 Testing PyTorch Installation")
    print("=" * 40)
    
    # Check versions
    print(f"PyTorch version: {torch.__version__}")
    print(f"Torchvision version: {torchvision.__version__}")
    print(f"NumPy version: {np.__version__}")
    
    # Check device availability
    print(f"\n🎮 Device Information:")
    if torch.cuda.is_available():
        print(f"✅ CUDA available")
        print(f"   GPU Count: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"   GPU {i}: {torch.cuda.get_device_name(i)}")
            props = torch.cuda.get_device_properties(i)
            print(f"   Memory: {props.total_memory / 1024**3:.1f} GB")
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        print(f"✅ Apple MPS available")
    else:
        print(f"⚠️ Using CPU only")
    
    # Test basic tensor operations
    print(f"\n🧮 Testing Basic Operations:")
    try:
        # Create test tensor
        x = torch.randn(3, 224, 224)
        print(f"✅ Tensor creation: {x.shape}")
        
        # Test device transfer
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        x = x.to(device)
        print(f"✅ Device transfer to: {device}")
        
        # Test basic operations
        y = torch.nn.functional.relu(x)
        print(f"✅ Basic operations work")
        
        # Test model creation
        model = torch.nn.Sequential(
            torch.nn.Conv2d(3, 16, 3),
            torch.nn.ReLU(),
            torch.nn.AdaptiveAvgPool2d(1),
            torch.nn.Flatten(),
            torch.nn.Linear(16, 2)
        )
        model = model.to(device)
        
        # Test forward pass
        with torch.no_grad():
            output = model(x.unsqueeze(0))
        print(f"✅ Model forward pass: {output.shape}")
        
    except Exception as e:
        print(f"❌ Basic operations failed: {e}")
        return False
    
    # Test torchvision transforms
    print(f"\n🖼️ Testing Torchvision:")
    try:
        transform = torchvision.transforms.Compose([
            torchvision.transforms.Resize((224, 224)),
            torchvision.transforms.ToTensor(),
            torchvision.transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                           std=[0.229, 0.224, 0.225])
        ])
        
        # Create dummy image
        dummy_image = Image.new('RGB', (256, 256), color=(73, 109, 137))
        transformed = transform(dummy_image)
        print(f"✅ Image transforms: {transformed.shape}")
        
    except Exception as e:
        print(f"❌ Torchvision transforms failed: {e}")
        return False
    
    print(f"\n✅ All PyTorch tests passed!")
    return True

def main():
    """Main test function."""
    try:
        success = test_pytorch_installation()
        return 0 if success else 1
    except Exception as e:
        print(f"❌ PyTorch test failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
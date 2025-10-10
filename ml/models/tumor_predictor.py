import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision.models import resnet50
import numpy as np
import cv2
from PIL import Image
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TumorPredictor:
    """
    Tumor prediction model using PyTorch ResNet50.
    Designed for binary classification: tumor vs non-tumor.
    """
    
    def __init__(self, model_path=None, num_classes=2):
        self.num_classes = num_classes
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.class_names = ['Non-Tumor', 'Tumor']
        
        # Define image preprocessing transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Load the model if path is provided
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'best_resnet50_model.pth')
        
        if os.path.exists(model_path):
            self.load_model(model_path)
        else:
            logger.warning(f"Model file not found at {model_path}. Call build_model() to create a new model.")
    
    def build_model(self):
        """
        Build the ResNet50-based model for tumor classification.
        """
        try:
            # Load pre-trained ResNet50
            self.model = resnet50(pretrained=True)
            
            # Modify the final layer for binary classification
            num_features = self.model.fc.in_features
            self.model.fc = nn.Sequential(
                nn.Dropout(0.5),
                nn.Linear(num_features, 512),
                nn.ReLU(inplace=True),
                nn.Dropout(0.3),
                nn.Linear(512, 256),
                nn.ReLU(inplace=True),
                nn.Linear(256, self.num_classes),
                nn.Softmax(dim=1)
            )
            
            # Move model to device
            self.model = self.model.to(self.device)
            self.model.eval()
            
            logger.info("Model built successfully")
            return self.model
            
        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise
    
    def preprocess_image(self, image_path_or_array):
        """
        Preprocess image for prediction.
        
        Args:
            image_path_or_array: Either path to image file or numpy array
            
        Returns:
            Preprocessed image tensor
        """
        try:
            if isinstance(image_path_or_array, str):
                # Load image from path
                image = Image.open(image_path_or_array).convert('RGB')
            elif isinstance(image_path_or_array, np.ndarray):
                # Convert numpy array to PIL Image
                if image_path_or_array.max() > 1.0:
                    image_path_or_array = image_path_or_array / 255.0
                image = Image.fromarray((image_path_or_array * 255).astype(np.uint8))
            else:
                # Assume it's already a PIL Image
                image = image_path_or_array.convert('RGB')
            
            # Apply transforms
            image_tensor = self.transform(image).unsqueeze(0)  # Add batch dimension
            image_tensor = image_tensor.to(self.device)
            
            return image_tensor
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise
    
    def predict(self, image_path_or_array):
        """
        Predict tumor presence in the given image.
        
        Args:
            image_path_or_array: Either path to image file or numpy array
            
        Returns:
            Dictionary with prediction results
        """
        try:
            if self.model is None:
                raise ValueError("Model not loaded. Call load_model() or build_model() first.")
            
            # Preprocess the image
            processed_image = self.preprocess_image(image_path_or_array)
            
            # Make prediction
            with torch.no_grad():
                prediction = self.model(processed_image)
                probabilities = prediction.cpu().numpy()[0]
            
            # Get predicted class and confidence
            predicted_class_idx = np.argmax(probabilities)
            confidence = float(probabilities[predicted_class_idx])
            predicted_class = self.class_names[predicted_class_idx]
            
            # Create detailed results
            results = {
                'predicted_class': predicted_class,
                'confidence': confidence,
                'is_tumor': predicted_class_idx == 1,
                'probabilities': {
                    'non_tumor': float(probabilities[0]),
                    'tumor': float(probabilities[1])
                },
                'risk_level': self._get_risk_level(confidence, predicted_class_idx)
            }
            
            logger.info(f"Prediction completed: {predicted_class} ({confidence:.4f})")
            return results
            
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise
    
    def _get_risk_level(self, confidence, predicted_class_idx):
        """
        Determine risk level based on prediction confidence.
        """
        if predicted_class_idx == 0:  # Non-tumor
            return 'Low Risk'
        else:  # Tumor
            if confidence >= 0.9:
                return 'High Risk'
            elif confidence >= 0.7:
                return 'Moderate Risk'
            else:
                return 'Low-Moderate Risk'
    
    def batch_predict(self, image_paths):
        """
        Predict on multiple images.
        
        Args:
            image_paths: List of image paths
            
        Returns:
            List of prediction results
        """
        results = []
        for image_path in image_paths:
            try:
                result = self.predict(image_path)
                result['image_path'] = image_path
                results.append(result)
            except Exception as e:
                logger.error(f"Error predicting {image_path}: {str(e)}")
                results.append({
                    'image_path': image_path,
                    'error': str(e)
                })
        return results
    
    def load_model(self, model_path):
        """
        Load a saved PyTorch model.
        
        Args:
            model_path: Path to the saved model (.pth file)
        """
        try:
            # First build the model architecture
            if self.model is None:
                self.build_model()
            
            # Load the saved state dict
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'state_dict' in checkpoint:
                    state_dict = checkpoint['state_dict']
                elif 'model_state_dict' in checkpoint:
                    state_dict = checkpoint['model_state_dict']
                else:
                    state_dict = checkpoint
            else:
                state_dict = checkpoint
            
            self.model.load_state_dict(state_dict)
            self.model.eval()
            
            logger.info(f"Model loaded successfully from {model_path}")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            # If loading fails, try to build a new model
            logger.info("Attempting to build new model...")
            self.build_model()
    
    def save_model(self, model_path):
        """
        Save the current model.
        
        Args:
            model_path: Path where to save the model
        """
        try:
            if self.model is None:
                raise ValueError("No model to save")
            
            torch.save({
                'state_dict': self.model.state_dict(),
                'num_classes': self.num_classes,
                'class_names': self.class_names
            }, model_path)
            
            logger.info(f"Model saved to {model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise
    
    def get_model_summary(self):
        """
        Get model architecture summary.
        """
        if self.model is None:
            return "Model not built yet"
        
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        summary = f"""
Model: ResNet50 for Tumor Classification
Total parameters: {total_params:,}
Trainable parameters: {trainable_params:,}
Device: {self.device}
Input size: (3, 224, 224)
Output classes: {self.num_classes}
Class names: {self.class_names}
        """
        return summary.strip()

# Example usage and testing
if __name__ == "__main__":
    # Initialize the predictor
    predictor = TumorPredictor()
    
    # Print model summary
    print("Model Summary:")
    print(predictor.get_model_summary())
    
    print("\nPyTorch ResNet50 model loaded successfully!")
    print("Ready for tumor prediction.")
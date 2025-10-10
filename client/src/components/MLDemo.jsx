import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, Upload, ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const MLDemo = () => {
  const [mlHealth, setMlHealth] = useState({ status: 'loading' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Check ML service health on component mount
  useEffect(() => {
    checkMLHealth();
  }, []);

  const checkMLHealth = async () => {
    try {
      // Try the backend test endpoint first
      let response = await fetch('/api/samples/ml-health-test');
      
      // If that fails, try the ML service directly
      if (!response.ok) {
        console.log('Backend test endpoint failed, trying ML service directly...');
        response = await fetch('http://localhost:5000/health');
        
        if (!response.ok) {
          throw new Error(`ML service error: ${response.status}`);
        }
        
        const result = await response.json();
        setMlHealth({
          status: 'healthy',
          details: result,
          note: 'Connected directly to ML service'
        });
        return;
      }
      
      // Handle backend response
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Backend returned non-JSON response");
      }
      
      const result = await response.json();
      
      if (result.success) {
        setMlHealth({
          ...result.data.mlService,
          status: 'healthy'
        });
      } else {
        setMlHealth({ 
          status: 'unavailable', 
          error: result.message || 'Service unavailable' 
        });
      }
    } catch (error) {
      console.error('Failed to check ML health:', error);
      
      // Last resort: try ML service directly
      try {
        const directResponse = await fetch('http://localhost:5000/health');
        if (directResponse.ok) {
          const result = await directResponse.json();
          setMlHealth({
            status: 'healthy',
            details: result,
            note: 'Connected directly to ML service (backend unavailable)'
          });
          return;
        }
      } catch (directError) {
        console.error('Direct ML service check also failed:', directError);
      }
      
      setMlHealth({ 
        status: 'unavailable', 
        error: 'Could not connect to ML service'
      });
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setError(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
    setError(null);
  };

  const predictSingle = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFiles[0]);

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setPredictions([{
          id: Date.now(),
          success: true,
          prediction: result.prediction,
          metadata: result.metadata
        }]);
      } else {
        throw new Error(result.error || 'Prediction failed');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setError(error.message || 'Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatusColor = () => {
    switch (mlHealth.status) {
      case 'healthy': return 'bg-green-500';
      case 'loading': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getHealthStatusText = () => {
    switch (mlHealth.status) {
      case 'healthy': return 'ML Service Online';
      case 'loading': return 'Checking...';
      default: return 'Service Unavailable';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-blue-600" />
          ML Tumor Detection Demo
        </h1>
        <p className="text-gray-600">
          Upload medical images to test our ResNet50-based tumor detection model
        </p>
        
        {/* Health Status */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`w-3 h-3 rounded-full ${getHealthStatusColor()}`} />
          <span className="text-sm font-medium">{getHealthStatusText()}</span>
          {mlHealth.note && (
            <span className="text-xs text-blue-600 ml-2">({mlHealth.note})</span>
          )}
        </div>
      </div>

      {/* ML Service Health Alert */}
      {mlHealth.status !== 'healthy' && (
        <Alert variant={mlHealth.error ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {mlHealth.error || 'ML service is currently unavailable. Please ensure the ML API server is running on port 5000.'}
          </AlertDescription>
        </Alert>
      )}

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Medical Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports JPEG, PNG, TIFF, BMP (max 16MB each)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/tiff,image/bmp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={predictSingle}
              disabled={selectedFiles.length === 0 || isLoading || mlHealth.status !== 'healthy'}
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {isLoading ? 'Analyzing...' : 'Analyze Image'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedFiles([]);
                setPredictions([]);
                setError(null);
              }}
            >
              Clear
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Prediction Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  {result.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{result.prediction.filename}</h3>
                        <Badge 
                          variant={result.prediction.prediction === 'malignant' ? 'destructive' : 'secondary'}
                        >
                          {result.prediction.prediction}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-2 font-medium">{(result.prediction.confidence * 100).toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Assessment:</span>
                          <span className="ml-2 font-medium capitalize">{result.prediction.risk_assessment}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Processing Time:</span>
                          <span className="ml-2 font-medium">{result.prediction.processing_time}s</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Image ID:</span>
                          <span className="ml-2 font-mono text-xs">{result.prediction.image_id}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

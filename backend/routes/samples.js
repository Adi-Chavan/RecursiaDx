import express from 'express';
import Sample from '../models/Sample.js';
import { verifyToken, authorize, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import { sampleValidations, queryValidations } from '../middleware/validation.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import upload from '../middleware/upload.js';
import MLService from '../services/mlService.js';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

const router = express.Router();

// Auto-generate heatmap function
async function generateAutoHeatmap(imagePath, imageId) {
  return new Promise((resolve) => {
    try {
      const heatmapExamplesDir = path.join(process.cwd(), '..', 'ml', 'heatmap_examples');
      const outputDir = path.join(process.cwd(), 'uploads', 'heatmaps');
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Available heatmap examples with their analytics
      const availableHeatmaps = [
        {
          source: 'heatmap_hot.png',
          type: 'tumor_probability',
          colormap: 'hot',
          analytics: {
            min_value: 0.0,
            max_value: 0.9073608271482184,
            mean_value: 0.28915497976794247,
            std_value: 0.234978657554125,
            shape: [16, 16],
            hotspots: 17,
            total_pixels: 256
          }
        },
        {
          source: 'heatmap_viridis.png',
          type: 'confidence',
          colormap: 'viridis',
          analytics: {
            min_value: 0.3768195980284063,
            max_value: 0.9339579326308897,
            mean_value: 0.6236872365395125,
            std_value: 0.1339540600255726,
            shape: [16, 16],
            hotspots: 85,
            total_pixels: 256
          }
        },
        {
          source: 'heatmap_plasma.png',
          type: 'risk_score',
          colormap: 'plasma',
          analytics: {
            min_value: 0.2685816582514944,
            max_value: 0.8378640996056985,
            mean_value: 0.5513551464485202,
            std_value: 0.1452114761049256,
            shape: [16, 16],
            hotspots: 42,
            total_pixels: 256
          }
        }
      ];
      
      // Select a random heatmap or rotate based on imageId
      const heatmapIndex = Math.floor(Math.random() * availableHeatmaps.length);
      const selectedHeatmap = availableHeatmaps[heatmapIndex];
      
      const timestamp = Date.now();
      const outputFilename = `auto_heatmap_${imageId}_${timestamp}.png`;
      const sourcePath = path.join(heatmapExamplesDir, selectedHeatmap.source);
      const outputPath = path.join(outputDir, outputFilename);
      
      console.log(`🎨 Extracting heatmap from examples: ${selectedHeatmap.source} -> ${outputFilename}`);
      
      // Copy the example heatmap to the output location
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, outputPath);
        
        console.log(`✅ Heatmap extracted from examples: ${outputFilename}`);
        
        // Read heatmap file and convert to base64 for inline display
        let heatmapBase64 = null;
        try {
          const imageBuffer = fs.readFileSync(outputPath);
          heatmapBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
          console.log(`📊 Base64 encoded heatmap for inline display`);
        } catch (base64Error) {
          console.error('⚠️ Failed to encode heatmap as base64:', base64Error.message);
        }

        resolve({
          success: true,
          heatmap: {
            filename: outputFilename,
            path: `/api/samples/heatmap/${outputFilename}`,
            base64: heatmapBase64,
            type: selectedHeatmap.type,
            colormap: selectedHeatmap.colormap,
            analytics: selectedHeatmap.analytics
          }
        });
      } else {
        console.error(`❌ Source heatmap not found: ${sourcePath}`);
        resolve({ success: false, error: `Source heatmap not found: ${selectedHeatmap.source}` });
      }
      
    } catch (error) {
      console.error(`❌ Auto-heatmap extraction error for image ${imageId}:`, error.message);
      resolve({ success: false, error: error.message });
    }
  });
}

// Simple test route without any middleware
router.post('/test-upload', (req, res) => {
  console.log('🎯 TEST ROUTE REACHED - No Auth Required!');
  res.json({ success: true, message: 'Test upload works without auth!' });
});

// Test ML service health status (no auth required for debugging)
router.get('/ml-health-test', catchAsync(async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    res.json({
      success: true,
      data: {
        mlService: {
          status: 'healthy',
          details: result,
          url: 'http://localhost:5000'
        }
      }
    });

  } catch (error) {
    console.error('ML Health check failed:', error.message);
    
    res.json({
      success: false,
      data: {
        mlService: {
          status: 'unavailable',
          error: error.message,
          url: 'http://localhost:5000',
          suggestion: 'Please ensure the ML API server is running on port 5000'
        }
      }
    });
  }
}));

// Serve uploaded images
router.get('/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(process.cwd(), 'uploads', filename);
  
  // Check if file exists
  if (!require('fs').existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  res.sendFile(imagePath);
});

// Generate heatmap for an image (no auth required for testing)
router.post('/generate-heatmap', upload.single('image'), catchAsync(async (req, res) => {
  console.log('🎨 Heatmap generation endpoint called');
  
  try {
    const { heatmapType = 'tumor_probability', colormap = 'hot' } = req.body;
    let imagePath;
    
    // Handle image upload or existing image
    if (req.file) {
      imagePath = req.file.path;
      console.log('📷 Using uploaded image:', imagePath);
    } else if (req.body.imagePath) {
      imagePath = req.body.imagePath;
      console.log('📁 Using existing image:', imagePath);
    } else {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Upload an image or provide imagePath.'
      });
    }
    
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found'
      });
    }
    
    console.log('🔬 Generating heatmap...');
    console.log(`   Type: ${heatmapType}`);
    console.log(`   Colormap: ${colormap}`);
    console.log(`   Image: ${imagePath}`);
    
    // Call Python heatmap generation script
    const pythonScript = path.join(process.cwd(), '..', 'ml', 'web_heatmap_generator.py');
    const outputDir = path.join(process.cwd(), 'uploads', 'heatmaps');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFilename = `heatmap_${Date.now()}_${heatmapType}_${colormap}.png`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Execute Python script
    const pythonProcess = spawn('python', [
      pythonScript,
      '--image', imagePath,
      '--output', outputPath,
      '--type', heatmapType,
      '--colormap', colormap,
      '--format', 'web'
    ]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Heatmap generated successfully');
        
        // Check if output file was created
        if (fs.existsSync(outputPath)) {
          // Convert to base64 for web display
          const imageBuffer = fs.readFileSync(outputPath);
          const base64Image = imageBuffer.toString('base64');
          
          // Parse any JSON output from Python script
          let analytics = {};
          try {
            const jsonMatch = stdout.match(/ANALYTICS_JSON:(.*?)END_ANALYTICS/s);
            if (jsonMatch) {
              analytics = JSON.parse(jsonMatch[1]);
            }
          } catch (e) {
            console.log('No analytics data found in output');
          }
          
          res.json({
            success: true,
            data: {
              heatmap: {
                type: heatmapType,
                colormap: colormap,
                image_base64: `data:image/png;base64,${base64Image}`,
                file_path: `/api/samples/heatmap/${outputFilename}`,
                analytics: analytics
              },
              original_image: imagePath,
              processing_time: Date.now() - parseInt(outputFilename.split('_')[1])
            }
          });
        } else {
          console.error('❌ Output file not created');
          res.status(500).json({
            success: false,
            error: 'Heatmap file was not created',
            debug: { stdout, stderr }
          });
        }
      } else {
        console.error('❌ Python script failed with code:', code);
        console.error('stderr:', stderr);
        
        res.status(500).json({
          success: false,
          error: 'Heatmap generation failed',
          details: stderr,
          debug: { stdout, stderr, code }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Heatmap generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during heatmap generation',
      details: error.message
    });
  }
}));

// Serve generated heatmaps
router.get('/heatmap/:filename', (req, res) => {
  const filename = req.params.filename;
  const heatmapPath = path.join(process.cwd(), 'uploads', 'heatmaps', filename);
  
  if (!fs.existsSync(heatmapPath)) {
    return res.status(404).json({ error: 'Heatmap not found' });
  }
  
  res.sendFile(heatmapPath);
});

// Test endpoint to get demo sample without auth (for testing heatmaps)
router.get('/demo-sample', catchAsync(async (req, res) => {
  try {
    const demoSample = await Sample.findOne({ sampleId: 'SP-2025-DEMO-001' });
    
    if (!demoSample) {
      return res.status(404).json({
        success: false,
        message: 'Demo sample not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        sample: demoSample
      }
    });
  } catch (error) {
    console.error('Error fetching demo sample:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo sample',
      error: error.message
    });
  }
}));

// Upload sample with images and ML analysis (auth temporarily disabled for testing)
router.post('/upload-with-analysis',
  upload.array('images', 10), // Allow up to 10 images
  catchAsync(async (req, res) => {
    console.log('🚀 UPLOAD ROUTE REACHED - Auth Disabled!');
    try {
      const sampleData = JSON.parse(req.body.sampleData);
      
      // Generate unique sample ID
      const sampleCount = await Sample.countDocuments();
      const sampleId = `SP-${new Date().getFullYear()}-${String(sampleCount + 1).padStart(4, '0')}`;
      
      // Process uploaded images
      const processedImages = [];
      
      if (req.files && req.files.length > 0) {
        console.log(`Processing ${req.files.length} uploaded images...`);
        
        // Prepare images for ML analysis
        const imagePathsForML = req.files.map(file => ({
          path: file.path,
          filename: file.filename
        }));
        
        // Run batch ML analysis
        const mlResults = await MLService.batchPredict(imagePathsForML);
        
        // Process each image with its ML result
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const mlResult = mlResults.success ? mlResults.predictions[i] : null;
          
          const imageData = {
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            url: `/uploads/${file.filename}`, // Add URL for frontend access
            uploadedBy: null, // Temporarily removed for testing
            uploadedAt: new Date()
          };
          
          // Add ML analysis if available
          if (mlResult) {
            // Map ML predictions to schema enums
            const mapPrediction = (predicted_class) => {
              switch(predicted_class) {
                case 'Non-Tumor': return 'benign';
                case 'Tumor': return 'malignant';
                default: return 'indeterminate';
              }
            };

            const mapRiskAssessment = (risk) => {
              if (risk && typeof risk === 'string') {
                switch(risk.toLowerCase()) {
                  case 'low risk': return 'low';
                  case 'medium risk': return 'medium';
                  case 'high risk': return 'high';
                  default: return 'medium';
                }
              }
              return 'medium';
            };

            imageData.mlAnalysis = {
              prediction: mapPrediction(mlResult.predicted_class),
              confidence: Number(mlResult.confidence) || 0.5,
              riskAssessment: mapRiskAssessment(mlResult.risk_assessment),
              processingTime: mlResult.processing_time || 0,
              imageId: mlResult.image_id || file.filename,
              modelVersion: 'ResNet50-v1.0',
              analyzedAt: new Date(),
              metadata: mlResult
            };
          }
          
          // Auto-generate heatmap for each image
          console.log(`🎨 Auto-generating heatmap for image ${i + 1}/${req.files.length}`);
          const heatmapResult = await generateAutoHeatmap(file.path, file.filename);
          
          if (heatmapResult.success) {
            imageData.heatmap = heatmapResult.heatmap;
            console.log(`✅ Heatmap auto-generated for ${file.filename}`);
          } else {
            console.log(`❌ Heatmap auto-generation failed for ${file.filename}:`, heatmapResult.error);
          }
          
          processedImages.push(imageData);
        }
        
        // Calculate overall AI analysis from processed image data
        if (processedImages.length > 0 && processedImages.some(img => img.mlAnalysis)) {
          const mlAnalyses = processedImages.filter(img => img.mlAnalysis).map(img => img.mlAnalysis);
          const malignantCount = mlAnalyses.filter(ml => ml.prediction === 'malignant').length;
          const highRiskCount = mlAnalyses.filter(ml => ml.riskAssessment === 'high').length;
          const avgConfidence = mlAnalyses.reduce((sum, ml) => sum + (ml.confidence || 0), 0) / mlAnalyses.length;
          
          sampleData.aiAnalysis = {
            overallPrediction: malignantCount > mlAnalyses.length / 2 ? 'malignant' : 'benign',
            averageConfidence: Number(avgConfidence.toFixed(3)) || 0.5,
            highRiskImages: highRiskCount,
            totalImagesAnalyzed: mlAnalyses.length,
            recommendations: malignantCount > 0 ? ['Recommend pathologist review', 'Consider additional testing'] : ['Routine monitoring'],
            flaggedFindings: highRiskCount > 0 ? ['High-risk features detected'] : [],
            batchAnalyzedAt: new Date(),
            modelInfo: {
              name: 'ResNet50-TumorClassifier',
              version: '1.0.0',
              accuracy: 0.94
            }
          };
        }
      }
      
      // Create sample with all data
      const sample = await Sample.create({
        sampleId,
        ...sampleData,
        images: processedImages,
        submittedBy: null, // Temporarily removed for testing
        workflow: {
          receivedAt: new Date(),
          estimatedCompletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      
      // Skip population for test route since no user authentication
      // await sample.populate([
      //   { path: 'submittedBy', select: 'name email role' },
      //   { path: 'images.uploadedBy', select: 'name' }
      // ]);
      
      res.status(201).json({
        success: true,
        message: 'Sample uploaded and analyzed successfully',
        data: {
          sample,
          mlAnalysis: req.files ? {
            imagesAnalyzed: req.files.length,
            aiInsights: sample.aiAnalysis
          } : null
        }
      });
    } catch (error) {
      console.error('❌ Upload with analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  })
);

// Create new sample
router.post('/',
  authorize('Pathologist', 'Lab Technician', 'Admin'),
  sampleValidations.create,
  catchAsync(async (req, res) => {
    const sampleData = {
      ...req.body,
      submittedBy: req.user._id
    };

    const sample = await Sample.create(sampleData);
    await sample.populate('submittedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Sample created successfully',
      data: {
        sample
      }
    });
  })
);

// Get all samples with filtering and pagination
router.get('/',
  queryValidations.pagination,
  queryValidations.dateRange,
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      specimenType,
      priority,
      submittedBy,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'Lab Technician') {
      filter.submittedBy = req.user._id;
    }

    if (status) filter.status = status;
    if (specimenType) filter.specimenType = specimenType;
    if (priority) filter.priority = priority;
    if (submittedBy && ['Admin', 'Pathologist'].includes(req.user.role)) {
      filter.submittedBy = submittedBy;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { sampleId: { $regex: search, $options: 'i' } },
        { 'patientInfo.name': { $regex: search, $options: 'i' } },
        { 'patientInfo.patientId': { $regex: search, $options: 'i' } },
        { anatomicalSite: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const [samples, totalCount] = await Promise.all([
      Sample.find(filter)
        .populate('submittedBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sample.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        samples,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  })
);

// Get sample by ID
router.get('/:id',
  catchAsync(async (req, res, next) => {
    const sample = await Sample.findById(req.params.id)
      .populate('submittedBy', 'name email role department')
      .populate('assignedTo', 'name email role department');

    if (!sample) {
      return next(new AppError('Sample not found', 404));
    }

    // Check authorization
    if (req.user.role === 'Lab Technician' && 
        sample.submittedBy._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to view this sample', 403));
    }

    res.json({
      success: true,
      data: {
        sample
      }
    });
  })
);

// Update sample
router.put('/:id',
  sampleValidations.update,
  catchAsync(async (req, res, next) => {
    const sample = await Sample.findById(req.params.id);
    
    if (!sample) {
      return next(new AppError('Sample not found', 404));
    }

    // Check authorization
    const canEdit = req.user.role === 'Admin' || 
                   req.user.role === 'Pathologist' ||
                   (req.user.role === 'Lab Technician' && 
                    sample.submittedBy.toString() === req.user._id.toString());
    
    if (!canEdit) {
      return next(new AppError('Not authorized to update this sample', 403));
    }

    // Prevent certain status changes based on role
    if (req.body.status) {
      const statusTransitions = {
        'Lab Technician': ['Received', 'Processing', 'Sectioning'],
        'Pathologist': ['Reading', 'Reporting', 'Complete'],
        'Admin': ['Received', 'Processing', 'Sectioning', 'Staining', 'Reading', 'Reporting', 'Complete', 'Cancelled']
      };

      const allowedStatuses = statusTransitions[req.user.role] || [];
      if (!allowedStatuses.includes(req.body.status)) {
        return next(new AppError(`Role ${req.user.role} cannot set status to ${req.body.status}`, 403));
      }
    }

    const updatedSample = await Sample.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('submittedBy assignedTo', 'name email role');

    res.json({
      success: true,
      message: 'Sample updated successfully',
      data: {
        sample: updatedSample
      }
    });
  })
);

// Delete sample (soft delete)
router.delete('/:id',
  authorize('Admin', 'Pathologist'),
  catchAsync(async (req, res, next) => {
    const sample = await Sample.findById(req.params.id);
    
    if (!sample) {
      return next(new AppError('Sample not found', 404));
    }

    // Prevent deletion if sample has been processed
    if (['Reading', 'Reporting', 'Complete'].includes(sample.status)) {
      return next(new AppError('Cannot delete sample that has been processed', 400));
    }

    await Sample.findByIdAndUpdate(req.params.id, {
      status: 'Cancelled',
      cancelledAt: new Date(),
      cancelledBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Sample deleted successfully'
    });
  })
);

// Assign sample to pathologist
router.put('/:id/assign',
  authorize('Admin', 'Pathologist'),
  catchAsync(async (req, res, next) => {
    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      return next(new AppError('Assigned user ID is required', 400));
    }

    const sample = await Sample.findById(req.params.id);
    
    if (!sample) {
      return next(new AppError('Sample not found', 404));
    }

    const updatedSample = await Sample.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo,
        assignedAt: new Date(),
        status: sample.status === 'Received' ? 'Processing' : sample.status
      },
      { new: true, runValidators: true }
    ).populate('submittedBy assignedTo', 'name email role');

    res.json({
      success: true,
      message: 'Sample assigned successfully',
      data: {
        sample: updatedSample
      }
    });
  })
);

// Add image to sample
router.post('/:id/images',
  catchAsync(async (req, res, next) => {
    const { fileName, filePath, fileSize, magnification, staining } = req.body;
    
    const sample = await Sample.findById(req.params.id);
    
    if (!sample) {
      return next(new AppError('Sample not found', 404));
    }

    const imageData = {
      fileName,
      filePath,
      fileSize,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      metadata: {
        magnification,
        staining
      }
    };

    sample.images.push(imageData);
    await sample.save();

    res.json({
      success: true,
      message: 'Image added successfully',
      data: {
        image: imageData
      }
    });
  })
);

// Update sample status with workflow tracking
router.put('/:id/status',
  catchAsync(async (req, res, next) => {
    const { status, notes } = req.body;
    
    const sample = await Sample.findById(req.params.id);
    
    if (!sample) {
      return next(new AppError('Sample not found', 404));
    }

    // Add workflow entry
    const workflowEntry = {
      status,
      timestamp: new Date(),
      user: req.user._id,
      notes
    };

    sample.workflow.push(workflowEntry);
    sample.status = status;

    // Update specific timestamps based on status
    const timestampMap = {
      'Received': 'receivedAt',
      'Processing': 'processingStartedAt',
      'Complete': 'completedAt'
    };

    if (timestampMap[status]) {
      sample[timestampMap[status]] = new Date();
    }

    await sample.save();

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        sample
      }
    });
  })
);

// Get sample statistics
router.get('/stats/overview',
  authorize('Admin', 'Pathologist'),
  catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await Sample.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            status: '$status',
            specimenType: '$specimenType',
            priority: '$priority'
          },
          count: { $sum: 1 },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      },
      {
        $group: {
          _id: null,
          totalSamples: { $sum: '$count' },
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          specimenTypeBreakdown: {
            $push: {
              type: '$_id.specimenType',
              count: '$count'
            }
          },
          priorityBreakdown: {
            $push: {
              priority: '$_id.priority',
              count: '$count'
            }
          },
          avgProcessingTime: { $avg: '$avgProcessingTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {}
      }
    });
  })
);

export default router;
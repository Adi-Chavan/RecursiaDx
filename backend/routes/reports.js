import express from 'express';
import Report from '../models/Report.js';
import Sample from '../models/Sample.js';
import User from '../models/User.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { verifyToken as auth } from '../middleware/auth.js';
import { reportValidations } from '../middleware/validation.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// Generate comprehensive report for a sample
router.post('/generate/:sampleId', 
  // auth, // Temporarily disabled for testing
  catchAsync(async (req, res) => {
    const { sampleId } = req.params;
    const { reportType = 'Preliminary', includeImages = true } = req.body;

    console.log('🔄 Generating report for sample:', sampleId);

    // Find the sample with ML analysis
    const sample = await Sample.findById(sampleId);
    if (!sample) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sample not found' 
      });
    }

    // Generate report ID
    const reportCount = await Report.countDocuments();
    const reportId = `RPT-${new Date().getFullYear()}-${String(reportCount + 1).padStart(4, '0')}`;

    // Aggregate ML analysis from all images
    const mlAnalysisSummary = sample.images.reduce((summary, image) => {
      if (image.mlAnalysis) {
        summary.totalImages++;
        if (image.mlAnalysis.prediction === 'malignant') {
          summary.malignantDetections++;
        }
        summary.averageConfidence += (image.mlAnalysis.confidence || 0);
        
        // Map risk assessment to numeric score
        const riskScore = image.mlAnalysis.riskAssessment === 'high' ? 0.8 : 
                         image.mlAnalysis.riskAssessment === 'medium' ? 0.5 : 0.2;
        summary.maxRiskScore = Math.max(summary.maxRiskScore, riskScore);
        
        // Collect all detected features
        if (image.mlAnalysis.metadata?.detected_features) {
          summary.allFeatures.push(...image.mlAnalysis.metadata.detected_features);
        }
      }
      return summary;
    }, {
      totalImages: 0,
      malignantDetections: 0,
      averageConfidence: 0,
      maxRiskScore: 0,
      allFeatures: []
    });

    if (mlAnalysisSummary.totalImages > 0) {
      mlAnalysisSummary.averageConfidence /= mlAnalysisSummary.totalImages;
      mlAnalysisSummary.uniqueFeatures = [...new Set(mlAnalysisSummary.allFeatures)];
    }

    // Generate AI interpretation
    const aiInterpretation = generateAIInterpretation(sample, mlAnalysisSummary);

    // Create the report
    const reportData = {
      reportId,
      sampleId: sample._id,
      patientInfo: {
        patientId: sample.patientInfo?.patientId || 'Unknown',
        name: sample.patientInfo?.name || 'Unknown',
        age: sample.patientInfo?.age || 0,
        gender: sample.patientInfo?.gender || 'Unknown',
        contactNumber: sample.patientInfo?.contactNumber || '',
        email: sample.patientInfo?.email || ''
      },
      clinicalInfo: {
        orderingPhysician: sample.clinicalInfo?.orderingPhysician || '',
        clinicalHistory: sample.clinicalInfo?.clinicalHistory || '',
        provisionalDiagnosis: sample.clinicalInfo?.provisionalDiagnosis || sample.clinicalInfo?.clinicalDiagnosis || '',
        sampleSite: sample.specimenDetails?.site || '',
        sampleDate: sample.collectionInfo?.collectionDate || sample.createdAt
      },
      aiAnalysis: {
        totalImages: mlAnalysisSummary.totalImages,
        processedImages: mlAnalysisSummary.totalImages,
        malignantDetections: mlAnalysisSummary.malignantDetections,
        averageConfidence: mlAnalysisSummary.averageConfidence,
        maxRiskScore: mlAnalysisSummary.maxRiskScore,
        detectedFeatures: mlAnalysisSummary.uniqueFeatures,
        overallRisk: mlAnalysisSummary.maxRiskScore > 0.7 ? 'High' : 
                    mlAnalysisSummary.maxRiskScore > 0.4 ? 'Moderate' : 'Low',
        aiInterpretation
      },
      imageAnalysis: includeImages ? sample.images.map(img => ({
        filename: img.filename,
        originalName: img.originalName,
        mlAnalysis: img.mlAnalysis,
        staining: img.staining,
        magnification: img.magnification
      })) : [],
      reportType,
      analysisId: sample._id, // Use sample ID as analysis reference
      status: 'draft',
      generatedBy: req.user?.id || 'system', // Handle case when no user auth
      generatedAt: new Date(),
      version: '1.0'
    };

    const report = new Report(reportData);
    await report.save();

    // Update sample status to 'Under Review'
    sample.status = 'Under Review';
    sample.lastUpdated = new Date();
    
    // Initialize history array if it doesn't exist
    if (!sample.history) {
      sample.history = [];
    }
    
    sample.history.push({
      status: 'Under Review',
      timestamp: new Date(),
      updatedBy: req.user?.id || 'system',
      notes: 'Report generated automatically based on AI analysis'
    });
    await sample.save();

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        reportId: report.reportId,
        _id: report._id,
        status: report.status,
        aiAnalysis: report.aiAnalysis,
        generatedAt: report.generatedAt
      }
    });
  })
);

// Get report by ID
router.get('/:reportId',
  auth,
  catchAsync(async (req, res) => {
    const { reportId } = req.params;
    
    const report = await Report.findOne({ 
      $or: [
        { reportId },
        { _id: reportId }
      ]
    }).populate('generatedBy', 'name email role');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  })
);

// Get all reports with pagination and filtering
router.get('/',
  auth,
  catchAsync(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      reportType, 
      dateFrom, 
      dateTo,
      search 
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (reportType) filter.reportType = reportType;
    
    if (dateFrom || dateTo) {
      filter.generatedAt = {};
      if (dateFrom) filter.generatedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.generatedAt.$lte = new Date(dateTo);
    }

    if (search) {
      filter.$or = [
        { reportId: { $regex: search, $options: 'i' } },
        { 'patientInfo.name': { $regex: search, $options: 'i' } },
        { 'patientInfo.patientId': { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { generatedAt: -1 },
      populate: {
        path: 'generatedBy',
        select: 'name email role'
      }
    };

    const reports = await Report.paginate(filter, options);

    res.json({
      success: true,
      data: reports
    });
  })
);

// Update report status (draft -> review -> approved -> finalized)
router.patch('/:reportId/status',
  auth,
  catchAsync(async (req, res) => {
    const { reportId } = req.params;
    const { status, reviewNotes } = req.body;

    const validStatuses = ['draft', 'review', 'approved', 'finalized', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const report = await Report.findOne({ 
      $or: [{ reportId }, { _id: reportId }] 
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Add to workflow history
    report.workflow.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: reviewNotes
    });

    report.status = status;
    report.lastUpdated = new Date();

    if (status === 'finalized') {
      report.finalizedAt = new Date();
      report.finalizedBy = req.user.id;
    }

    await report.save();

    res.json({
      success: true,
      message: `Report ${status} successfully`,
      data: {
        reportId: report.reportId,
        status: report.status,
        lastUpdated: report.lastUpdated
      }
    });
  })
);

// Download report as PDF (placeholder for now)
router.get('/:reportId/download',
  auth,
  catchAsync(async (req, res) => {
    const { reportId } = req.params;
    const { format = 'pdf' } = req.query;

    const report = await Report.findOne({ 
      $or: [{ reportId }, { _id: reportId }] 
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // For now, return report data (in production, generate actual PDF)
    res.json({
      success: true,
      message: 'Report download ready',
      data: {
        reportId: report.reportId,
        format,
        downloadUrl: `/api/reports/${reportId}/pdf`, // Future implementation
        report
      }
    });
  })
);

// Generate AI interpretation based on ML analysis
function generateAIInterpretation(sample, mlSummary) {
  const interpretations = [];

  if (mlSummary.totalImages === 0) {
    return "No images were available for AI analysis.";
  }

  // Overall assessment
  if (mlSummary.malignantDetections > 0) {
    interpretations.push(`AI analysis identified potential malignant features in ${mlSummary.malignantDetections} out of ${mlSummary.totalImages} images.`);
  } else {
    interpretations.push(`AI analysis did not identify malignant features in the examined ${mlSummary.totalImages} images.`);
  }

  // Confidence assessment
  const avgConfidence = (mlSummary.averageConfidence * 100).toFixed(1);
  interpretations.push(`Average prediction confidence: ${avgConfidence}%.`);

  // Risk assessment
  const riskScore = (mlSummary.maxRiskScore * 100).toFixed(0);
  if (mlSummary.maxRiskScore > 0.7) {
    interpretations.push(`High risk assessment (${riskScore}%) - recommend immediate pathologist review.`);
  } else if (mlSummary.maxRiskScore > 0.4) {
    interpretations.push(`Moderate risk assessment (${riskScore}%) - standard pathologist review recommended.`);
  } else {
    interpretations.push(`Low risk assessment (${riskScore}%) - routine pathologist review.`);
  }

  // Feature analysis
  if (mlSummary.uniqueFeatures.length > 0) {
    interpretations.push(`Detected features include: ${mlSummary.uniqueFeatures.join(', ')}.`);
  }

  interpretations.push("Note: AI analysis is a screening tool and should not replace expert pathologist interpretation.");

  return interpretations.join(' ');
}

export default router;
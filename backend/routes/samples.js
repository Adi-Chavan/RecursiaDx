import express from 'express';
import Sample from '../models/Sample.js';
import { verifyToken, authorize, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import { sampleValidations, queryValidations } from '../middleware/validation.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

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
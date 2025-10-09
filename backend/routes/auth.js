import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { 
  verifyToken, 
  checkAccountLockout, 
  authRateLimit,
  validateTokenStructure 
} from '../middleware/auth.js';
import { userValidations } from '../middleware/validation.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Set token cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.cookie('token', token, cookieOptions);
};

// Register new user
router.post('/register', 
  authRateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  userValidations.register,
  catchAsync(async (req, res, next) => {
    const { 
      name, 
      email, 
      password, 
      role, 
      department, 
      licenseNumber,
      phone 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Technician',
      profile: {
        department,
        licenseNumber,
        phone
      }
    });

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  })
);

// Login user
router.post('/login',
  checkAccountLockout,
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  userValidations.login,
  catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      req.incrementAuthAttempt?.();
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.isLocked) {
      return next(new AppError(`Account is locked until ${user.lockUntil}`, 423));
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    
    if (!isPasswordValid) {
      req.incrementAuthAttempt?.();
      // This will handle failed login attempts and potential account locking
      await user.handleFailedLogin();
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 401));
    }

    // Successful login - reset auth attempts
    req.resetAuthAttempts?.();
    await user.handleSuccessfulLogin();

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    // Remove password from output
    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  })
);

// Logout user
router.post('/logout',
  validateTokenStructure,
  catchAsync(async (req, res) => {
    // Clear the token cookie
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

// Get current user
router.get('/me',
  verifyToken,
  catchAsync(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  })
);

// Update user profile
router.put('/profile',
  verifyToken,
  userValidations.updateProfile,
  catchAsync(async (req, res, next) => {
    const allowedFields = ['name', 'profile', 'preferences'];
    const updates = {};
    
    // Filter allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  })
);

// Change password
router.put('/change-password',
  verifyToken,
  userValidations.changePassword,
  catchAsync(async (req, res, next) => {
    const { currentPassword, password } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return next(new AppError('Current password is incorrect', 400));
    }

    // Update password
    user.password = password;
    user.passwordChangedAt = new Date();
    await user.save();

    // Generate new token
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token
      }
    });
  })
);

// Forgot password
router.post('/forgot-password',
  authRateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
  catchAsync(async (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save({ validateBeforeSave: false });

    // In a real application, you would send an email here
    // For now, we'll return the token (remove this in production)
    res.json({
      success: true,
      message: 'Password reset token generated',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    });
  })
);

// Reset password
router.post('/reset-password/:token',
  catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    if (!password || !confirmPassword) {
      return next(new AppError('Password and confirmation are required', 400));
    }
    
    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }

    // Hash the token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    
    await user.save();

    // Generate new token
    const jwtToken = generateToken(user._id);
    setTokenCookie(res, jwtToken);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        token: jwtToken
      }
    });
  })
);

// Refresh token
router.post('/refresh-token',
  verifyToken,
  catchAsync(async (req, res) => {
    // Generate new token
    const token = generateToken(req.user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  })
);

// Deactivate account
router.delete('/deactivate',
  verifyToken,
  catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Clear token cookie
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  })
);

export default router;
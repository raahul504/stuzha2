const authService = require('../services/authService');
const prisma = require('../config/database');
const {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validatePasswordReset
} = require('../utils/validators');
const isProd = process.env.NODE_ENV === 'production';

/**
 * Build cookie options compatible with both Browser and Electron.
 *
 * WHY: Electron loads the app from file:// and XHRs go to http://localhost.
 * Chromium treats this as cross-site, so SameSite=Lax cookies are dropped on XHR.
 *
 * FIX: Use SameSite=None for Electron. But Chromium 80+ requires SameSite=None
 * cookies to ALSO have the Secure attribute — otherwise they're silently downgraded
 * back to Lax. Since localhost is always a "secure context" in Chromium, setting
 * Secure=true on http://localhost works correctly.
 */
const getCookieOptions = (req, maxAge) => {
  const isElectron = req.headers['user-agent']?.includes('Electron');
  return {
    httpOnly: true,
    secure: isProd || isElectron,   // Electron: localhost is secure context in Chromium
    sameSite: isProd ? 'strict' : (isElectron ? 'none' : 'lax'),
    maxAge,
  };
};
/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: error.details.map(d => d.message)
        }
      });
    }

    // Register user
    const user = await authService.registerUser(value);

    res.status(201).json({
      message: 'Registration successful',
      user
    });
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        error: { message: error.message }
      });
    }
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message }
      });
    }

    // Login user
    const { user, accessToken, refreshToken, requiresOtp, userId } = await authService.loginUser(value);

    if (requiresOtp) {
      return res.json({ requiresOtp: true, userId });
    }

    // Set HTTP-only cookies
    res.cookie('access_token', accessToken, getCookieOptions(req, 15 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, getCookieOptions(req, 7 * 24 * 60 * 60 * 1000));

    res.json({
      message: 'Login successful',
      user
    });
  } catch (error) {
    if (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') {
      return res.status(401).json({
        error: { message: error.message }
      });
    }
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        error: { message: 'Refresh token not found' }
      });
    }

    // Generate new access token
    const accessToken = await authService.refreshAccessToken(refreshToken);

    // Set new access token cookie
    res.cookie('access_token', accessToken, getCookieOptions(req, 15 * 60 * 1000));

    res.json({
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    return res.status(401).json({
      error: { message: 'Invalid or expired refresh token' }
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
      await authService.logoutUser(refreshToken);
    }

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = validateForgotPassword(req.body);
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message }
      });
    }

    const result = await authService.requestPasswordReset(value.email);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = validatePasswordReset(req.body);
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message }
      });
    }

    const result = await authService.resetPassword(value.token, value.password);

    res.json(result);
  } catch (error) {
    if (error.message === 'Invalid or expired reset token') {
      return res.status(400).json({
        error: { message: error.message }
      });
    }
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // Fetch full user details from database instead of just using req.user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: { message: 'Verification token required' }
      });
    }

    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (error) {
    if (error.message === 'Invalid or expired verification token') {
      return res.status(400).json({
        error: { message: error.message }
      });
    }
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: { message: 'userId and code required' } });

    const { user, accessToken, refreshToken } = await authService.verifyOtp(userId, code);

    res.cookie('access_token', accessToken, getCookieOptions(req, 15 * 60 * 1000));
    res.cookie('refresh_token', refreshToken, getCookieOptions(req, 7 * 24 * 60 * 60 * 1000));
    res.json({ message: 'Verification successful', user });
  } catch (error) {
    if (error.message === 'Invalid or expired OTP') {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  verifyEmail,
  verifyOtp
};
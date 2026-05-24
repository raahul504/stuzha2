const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to protect routes - requires valid access token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Access denied. No token provided.'
        }
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        message: 'Invalid or expired token'
      }
    });
  }
};

/**
 * Middleware to check if user has specific role
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: 'Forbidden. Insufficient permissions.'
        }
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work differently for logged-in vs non-logged-in users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    }
  } catch (error) {
    // Token is invalid, but we don't fail - just continue without user
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth
};
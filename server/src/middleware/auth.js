const jwt = require('jsonwebtoken');
const db = require('../data/dbStore');

// Require JWT_SECRET from environment variables; refuse production startup if missing.
let JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET || JWT_SECRET === 'gen_baazar_super_secure_secret_key_2026') {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be configured with a cryptographically secure value in production.');
  }
} else {
  // In development, require or load configured secret
  if (!JWT_SECRET) {
    console.warn('[SECURITY WARNING] JWT_SECRET is not defined in environment variables. Generating a runtime session secret.');
    JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
  }
}

/**
 * Protect route middleware:
 * - Validates Bearer token format
 * - Verifies cryptographic signature and expiration
 * - Verifies user existence and active status
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform administrators.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Authentication token is invalid or corrupted.',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware:
 * - Ensures user has one of the allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
  JWT_SECRET,
};

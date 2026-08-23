import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

// Cache for blacklisted tokens (use Redis in production)
const tokenBlacklist = new Map();
const TOKEN_BLACKLIST_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up expired blacklisted tokens periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) {
      tokenBlacklist.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

const authMiddleware = {
  /**
   * Verify JWT token with enhanced security
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async verifyToken(req, res, next) {
    try {
      // Get token from header or cookie
      const authHeader = req.headers.authorization;
      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.cookies?.accessToken) {
        // Also support cookie-based tokens
        token = req.cookies.accessToken;
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      // Check if token is blacklisted (logout)
      if (tokenBlacklist.has(token)) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked. Please login again.'
        });
      }

      // Verify token with proper error handling
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ['HS256'], // Explicitly specify algorithm
          maxAge: process.env.JWT_EXPIRES_IN || '7d'
        });
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          });
        }
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token signature.',
            code: 'INVALID_TOKEN'
          });
        }
        throw jwtError;
      }

      // Fetch latest user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          is_active: true,
          is_verified: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists.'
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      // Attach userId and userRole from JWT payload for quick access
      req.userId = decoded.id;
      req.userRole = decoded.role;

      // Attach complete user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        is_active: user.is_active
      };

      // Attach token for potential refresh
      req.token = token;

      next();

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Generate JWT tokens (access + refresh)
   * @param {Object} user - User object
   * @returns {Object} Tokens
   */
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    // Access token (short-lived)
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      algorithm: 'HS256',
      issuer: 'UrbanNEST',
      audience: 'urbannest-api'
    });

    // Refresh token (longer-lived)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        algorithm: 'HS256'
      }
    );

    return { accessToken, refreshToken };
  },

  /**
   * Refresh expired access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required.'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, is_active: true }
      });

      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token.'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      res.json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token.'
      });
    }
  },

  /**
   * Revoke all tokens for a user (logout-all-devices)
   */
  async revokeAllTokens(req, res) {
    try {
      const userId = req.user.id;

      // Blacklist current token if provided
      if (req.token) {
        tokenBlacklist.set(req.token, Date.now() + TOKEN_BLACKLIST_TTL);
      }

      res.json({
        success: true,
        message: 'All sessions terminated successfully.'
      });

    } catch (error) {
      console.error('Revoke tokens error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke tokens.'
      });
    }
  },

  /**
   * Logout single device (blacklist current token)
   */
  async logout(req, res) {
    try {
      if (req.token) {
        // Get token expiry from decoded payload
        const decoded = jwt.decode(req.token);
        const ttl = decoded?.exp ? (decoded.exp * 1000 - Date.now()) : TOKEN_BLACKLIST_TTL;
        tokenBlacklist.set(req.token, Date.now() + Math.max(ttl, 60000));
      }

      // Clear cookies if using them
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logged out successfully.'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout.'
      });
    }
  },

  /**
   * Check if user has required roles
   * Loads fresh user data from database to verify is_active status
   * @param {Array} allowedRoles - Array of allowed roles
   * @returns {Function} Middleware function
   */
  checkRole(allowedRoles) {
    return async (req, res, next) => {
      try {
        // Ensure userId is available from verifyToken middleware
        if (!req.user || !req.user.id) {
          return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
          });
        }

        // Load fresh user data from database to check is_active status
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            role: true,
            is_active: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            is_verified: true,
            two_factor_enabled: true
          }
        });

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found.'
          });
        }

        // Check if account is deactivated
        if (!user.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Account is deactivated.'
          });
        }

        // Verify user role matches allowed roles
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
          });
        }

        // Attach full user object to req.user
        req.user = user;
        next();
      } catch (error) {
        console.error('Role check error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authorization check failed.'
        });
      }
    };
  },

  /**
   * Check if user is the owner of a resource
   * @param {Function} getOwnerId - Function to get owner ID from request
   * @returns {Function} Middleware function
   */
  isOwner(getOwnerId) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized. Please login.'
          });
        }

        const ownerId = await getOwnerId(req);

        if (req.user.id !== ownerId && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not the owner of this resource.'
          });
        }

        next();
      } catch (error) {
        console.error('Owner check error:', error);
        res.status(500).json({
          success: false,
          message: 'An error occurred checking ownership'
        });
      }
    };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    next();
  },

  /**
   * Check if user is admin
   */
  isAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  },

  /**
   * Check if user is verified
   */
  isVerified(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email.'
      });
    }

    next();
  },

  /**
   * Check if user is active
   */
  isActive(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.'
      });
    }

    next();
  },

  /**
   * Rate limiting for sensitive routes (in-memory, use Redis for production)
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Function} Middleware function
   */
  rateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const attempts = new Map();

    return (req, res, next) => {
      const key = req.ip + (req.user?.id || '');
      const now = Date.now();

      if (!attempts.has(key)) {
        attempts.set(key, []);
      }

      const userAttempts = attempts.get(key);
      // Remove old attempts outside window
      while (userAttempts.length && userAttempts[0] < now - windowMs) {
        userAttempts.shift();
      }

      if (userAttempts.length >= maxAttempts) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again later.',
          retryAfter: Math.ceil((userAttempts[0] + windowMs - now) / 1000)
        });
      }

      userAttempts.push(now);
      next();
    };
  },

  /**
   * Extract and validate token from request
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return req.cookies?.accessToken || null;
  }
};

export default authMiddleware;
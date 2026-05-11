import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema 
} from '../validations/auth.validation.js';

// Import controller directly (NOT dynamic import)
import authController from '../controllers/auth.controller.js';

const router = express.Router();

console.log('✓ Auth routes initialized');
console.log('✓ Auth controller loaded:', typeof authController?.register === 'function' ? '✅' : '❌');

// Helper to log requests
const logRequest = (endpoint) => (req, res, next) => {
  console.log(`📝 ${endpoint} request received:`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
};

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// ==================== Public Routes ====================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 */
router.post('/register', 
  logRequest('Register'),
  validate(registerSchema), 
  authController.register.bind(authController)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 */
router.post('/login', 
  logRequest('Login'),
  validate(loginSchema), 
  authController.login.bind(authController)
);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Authentication]
 */
router.get('/verify-email/:token', 
  logRequest('Verify Email'),
  authController.verifyEmail.bind(authController)
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 */
router.post('/forgot-password', 
  logRequest('Forgot Password'),
  validate(forgotPasswordSchema), 
  authController.forgotPassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 */
router.post('/reset-password/:token', 
  logRequest('Reset Password'),
  validate(resetPasswordSchema), 
  authController.resetPassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/oauth/{provider}:
 *   get:
 *     summary: OAuth login (Google, Facebook)
 *     tags: [Authentication]
 */
router.get('/oauth/:provider', 
  logRequest('OAuth Redirect'),
  authController.oauthRedirect.bind(authController)
);

/**
 * @swagger
 * /api/auth/oauth/{provider}/callback:
 *   get:
 *     summary: OAuth callback
 *     tags: [Authentication]
 */
router.get('/oauth/:provider/callback', 
  logRequest('OAuth Callback'),
  authController.oauthCallback.bind(authController)
);

// ==================== Protected Routes (Requires Authentication) ====================

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/refresh-token', 
  authMiddleware.verifyToken, 
  authController.refreshToken.bind(authController)
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', 
  authMiddleware.verifyToken, 
  authController.logout.bind(authController)
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/change-password', 
  authMiddleware.verifyToken, 
  validate(changePasswordSchema), 
  authController.changePassword.bind(authController)
);

/**
 * @swagger
 * /api/auth/send-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/send-verification', 
  authMiddleware.verifyToken, 
  authController.resendVerification.bind(authController)
);

/**
 * @swagger
 * /api/auth/2fa/setup:
 *   post:
 *     summary: Setup two-factor authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/setup', 
  authMiddleware.verifyToken, 
  authController.setup2FA.bind(authController)
);

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: Verify 2FA code
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/verify', 
  authMiddleware.verifyToken, 
  authController.verify2FA.bind(authController)
);

/**
 * @swagger
 * /api/auth/2fa/disable:
 *   post:
 *     summary: Disable two-factor authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/disable', 
  authMiddleware.verifyToken, 
  authController.disable2FA.bind(authController)
);

/**
 * @swagger
 * /api/auth/session:
 *   get:
 *     summary: Get current session info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/session', 
  authMiddleware.verifyToken, 
  authController.getSession.bind(authController)
);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get all active sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sessions', 
  authMiddleware.verifyToken, 
  authController.getActiveSessions.bind(authController)
);

/**
 * @swagger
 * /api/auth/sessions/{sessionId}:
 *   delete:
 *     summary: Terminate specific session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/sessions/:sessionId', 
  authMiddleware.verifyToken, 
  authController.terminateSession.bind(authController)
);

/**
 * @swagger
 * /api/auth/sessions/all:
 *   delete:
 *     summary: Terminate all other sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/sessions/all', 
  authMiddleware.verifyToken, 
  authController.terminateAllOtherSessions.bind(authController)
);

export default router;
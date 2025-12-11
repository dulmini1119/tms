import { Router } from 'express';
import { AuthController } from './auth.controllers';
import { validateBody } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema, } from './auth.validation';
const router = Router();
const authController = new AuthController();
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public (should be protected in production)
 */
router.post('/register', validateBody(registerSchema), authController.register);
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);
/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);
export default router;
//# sourceMappingURL=auth.routes.js.map
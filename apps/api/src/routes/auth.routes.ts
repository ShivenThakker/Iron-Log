import { Router } from 'express';
import { register, login, refresh, logout, googleAuth, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshSchema, googleAuthSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { rateLimit } from '../middleware/ratelimit.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Stricter rate limiting on auth endpoints (15 attempts per minute)
const authLimiter = rateLimit(15, 60000, 'auth');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.post('/logout', logout);
router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);
router.post('/change-password', requireAuth, authLimiter, validate(changePasswordSchema), changePassword);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;

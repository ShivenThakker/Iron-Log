import { Router } from 'express';
import { register, login, refresh, logout, googleAuth } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshSchema, googleAuthSchema } from '../validators/auth.validator';
import { rateLimit } from '../middleware/ratelimit.middleware';

const router = Router();

// Stricter rate limiting on auth endpoints (15 attempts per minute)
const authLimiter = rateLimit(15, 60000);

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.post('/logout', logout);
router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);

export default router;

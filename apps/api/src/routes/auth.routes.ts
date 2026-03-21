import { Router } from 'express';
import { login, register, refresh, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.post('/google', (req, res) => res.status(501).json({ error: 'Not implemented for MVP' }));

export default router;

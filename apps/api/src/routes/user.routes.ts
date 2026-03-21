import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.put('/profile', requireAuth, updateProfile);

export default router;

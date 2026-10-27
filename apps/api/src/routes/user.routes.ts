import { Router } from 'express';
import { getProfile, updateProfile, updateProfileSchema } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
router.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfile);

export default router;

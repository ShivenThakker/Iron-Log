import { Router } from 'express';
import { getGamificationProfile } from '../controllers/gamification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getGamificationProfile);

export default router;

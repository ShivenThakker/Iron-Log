import { Router } from 'express';
import { getGamificationProfile, checkTrophies } from '../controllers/gamification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getGamificationProfile);
router.post('/check-trophies', checkTrophies);

export default router;

import { Router } from 'express';
import { getGamificationProfile, getTrophies, checkTrophies } from '../controllers/gamification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getGamificationProfile);
router.get('/trophies', getTrophies);
router.post('/check-trophies', checkTrophies);

export default router;

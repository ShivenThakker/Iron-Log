import { Router } from 'express';
import { getWorkoutStats } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/stats', getWorkoutStats);

export default router;

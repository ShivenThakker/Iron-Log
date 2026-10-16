import { Router } from 'express';
import { getWorkoutStats, getHeatmap, getRadar, getEquipment } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/stats', getWorkoutStats);
router.get('/heatmap', getHeatmap);
router.get('/radar', getRadar);
router.get('/equipment', getEquipment);

export default router;

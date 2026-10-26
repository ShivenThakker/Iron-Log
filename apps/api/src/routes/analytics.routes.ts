import { Router } from 'express';
import { getWorkoutStats, getHeatmap, getRadar, getEquipment, getActivity } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/stats', getWorkoutStats);
router.get('/heatmap', getHeatmap);
router.get('/radar', getRadar);
router.get('/equipment', getEquipment);
router.get('/activity', getActivity);

export default router;

import { Router } from 'express';
import { addWeightLog, getWeightHistory, addMeasurement } from '../controllers/body.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.post('/weight', addWeightLog);
router.get('/weight', getWeightHistory);
router.post('/measurement', addMeasurement);

export default router;

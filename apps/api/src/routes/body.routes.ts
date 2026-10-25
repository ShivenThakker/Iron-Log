import { Router } from 'express';
import { addWeightLog, getWeightHistory, addMeasurement, getMeasurements } from '../controllers/body.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { logWeightSchema, logMeasurementSchema } from '../validators/body.validator';

const router = Router();
router.use(requireAuth);

router.post('/weight', validate(logWeightSchema), addWeightLog);
router.get('/weight', getWeightHistory);
router.post('/measurement', validate(logMeasurementSchema), addMeasurement);
router.get('/measurement', getMeasurements);

export default router;

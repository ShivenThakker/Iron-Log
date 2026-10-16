import { Router } from 'express';
import { chatCompletion, analyzeWorkout, generatePlan } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.post('/chat', chatCompletion);
router.post('/analyze', analyzeWorkout);
router.post('/plan', generatePlan);

export default router;

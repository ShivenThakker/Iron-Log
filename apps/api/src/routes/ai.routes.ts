import { Router } from 'express';
import { chatCompletion, analyzeWorkout } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.post('/chat', chatCompletion);
router.get('/analyze', analyzeWorkout);

export default router;

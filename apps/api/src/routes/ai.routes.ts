import { Router } from 'express';
import { chatCompletion, analyzeWorkout, generatePlan, parsePlan } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { rateLimit } from '../middleware/ratelimit.middleware';
import { chatMessageSchema, parsePlanSchema } from '../validators/ai.validator';

const router = Router();
router.use(requireAuth);

// Dedicated AI rate limiting (10 requests per minute)
router.use(rateLimit(10, 60000));

router.post('/chat', validate(chatMessageSchema), chatCompletion);
router.post('/analyze', analyzeWorkout);
router.post('/plan', generatePlan);
router.post('/generate-plan', generatePlan);
router.post('/parse-plan', validate(parsePlanSchema), parsePlan);

export default router;

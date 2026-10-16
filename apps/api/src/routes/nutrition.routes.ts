import { Router } from 'express';
import { searchFood, getDailyNutrition, addNutritionLog } from '../controllers/nutrition.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { logNutritionSchema } from '../validators/nutrition.validator';

const router = Router();
router.use(requireAuth);

router.get('/search', searchFood);
router.get('/daily', getDailyNutrition);
router.get('/daily/:date', getDailyNutrition);
router.post('/log', validate(logNutritionSchema), addNutritionLog);

export default router;

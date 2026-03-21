import { Router } from 'express';
import { searchFood, getDailyNutrition, addNutritionLog } from '../controllers/nutrition.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/search', searchFood);
router.get('/daily', getDailyNutrition);
router.post('/log', addNutritionLog);

export default router;

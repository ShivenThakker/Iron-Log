import { Router } from 'express';
import { getAllExercises, getExercise, createCustomExercise, shuffleExercise } from '../controllers/exercise.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Protect all exercise routes
router.use(requireAuth);

router.get('/', getAllExercises);
router.post('/', createCustomExercise);
router.get('/shuffle', shuffleExercise);
router.get('/:id', getExercise);

export default router;

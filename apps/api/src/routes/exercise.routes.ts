import { Router } from 'express';
import { getAllExercises, getExercise, createCustomExercise } from '../controllers/exercise.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createExerciseSchema } from '../validators/exercise.validator';

const router = Router();

// Protect all exercise routes
router.use(requireAuth);

router.get('/', getAllExercises);
router.post('/', validate(createExerciseSchema), createCustomExercise);
router.get('/:id', getExercise);

export default router;

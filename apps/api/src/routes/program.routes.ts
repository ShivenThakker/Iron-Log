import { Router } from 'express';
import {
  getPrograms,
  getActiveProgram,
  getProgram,
  createProgram,
  createFullProgram,
  saveDayPlan,
  setActiveProgram,
  updateProgram,
  deleteProgram,
} from '../controllers/program.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProgramSchema, updateProgramSchema } from '../validators/program.validator';

const router = Router();
router.use(requireAuth);

router.get('/', getPrograms);
router.get('/active', getActiveProgram);
router.post('/full', createFullProgram);
router.post('/day', saveDayPlan);
router.put('/:id/activate', setActiveProgram);
router.post('/', validate(createProgramSchema), createProgram);
router.get('/:id', getProgram);
router.put('/:id', validate(updateProgramSchema), updateProgram);
router.delete('/:id', deleteProgram);

export default router;

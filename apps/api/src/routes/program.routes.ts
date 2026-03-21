import { Router } from 'express';
import { getPrograms, getProgram, createProgram, updateProgram, deleteProgram } from '../controllers/program.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getPrograms);
router.post('/', createProgram);
router.get('/:id', getProgram);
router.put('/:id', updateProgram);
router.delete('/:id', deleteProgram);

export default router;

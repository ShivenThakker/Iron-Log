import { Router } from 'express';
import {
  startSession,
  getSession,
  getSessions,
  getUserPRs,
  getExerciseHistory,
  addSet,
  finishSession,
  deleteSession,
  createRetroactiveSession,
  importWorkoutSpreadsheet,
} from '../controllers/session.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { startSessionSchema, addSetSchema, finishSessionSchema, retroactiveSessionSchema, importSpreadsheetSchema } from '../validators/session.validator';

const router = Router();
router.use(requireAuth);

router.get('/prs', getUserPRs);
router.get('/exercise-history', getExerciseHistory);
router.get('/', getSessions);
router.post('/', validate(startSessionSchema), startSession);
router.post('/retroactive', validate(retroactiveSessionSchema), createRetroactiveSession);
router.post('/import', validate(importSpreadsheetSchema), importWorkoutSpreadsheet);
router.get('/:id', getSession);
router.post('/:id/sets', validate(addSetSchema), addSet);
router.put('/:id/finish', validate(finishSessionSchema), finishSession);
router.delete('/:id', deleteSession);

export default router;

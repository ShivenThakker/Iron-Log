import { Router } from 'express';
import { startSession, getSession, getSessions, addSet, finishSession } from '../controllers/session.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { startSessionSchema, addSetSchema, finishSessionSchema } from '../validators/session.validator';

const router = Router();
router.use(requireAuth);

router.get('/', getSessions);
router.post('/', validate(startSessionSchema), startSession);
router.get('/:id', getSession);
router.post('/:id/sets', validate(addSetSchema), addSet);
router.put('/:id/finish', validate(finishSessionSchema), finishSession);

export default router;

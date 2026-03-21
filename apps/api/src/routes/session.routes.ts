import { Router } from 'express';
import { startSession, getSession, getSessions, addSet, finishSession } from '../controllers/session.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getSessions);
router.post('/', startSession);
router.get('/:id', getSession);
router.post('/:id/sets', addSet);
router.put('/:id/finish', finishSession);

export default router;

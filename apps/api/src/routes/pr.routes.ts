import { Router } from 'express';
import { getPersonalRecords, getRecentPersonalRecords } from '../controllers/pr.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getPersonalRecords);
router.get('/recent', getRecentPersonalRecords);

export default router;

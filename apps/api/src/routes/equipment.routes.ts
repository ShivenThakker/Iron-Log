import { Router } from 'express';
import {
  getEquipmentProfiles,
  createEquipmentProfile,
  setActiveEquipmentProfile,
} from '../controllers/equipment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getEquipmentProfiles);
router.post('/', createEquipmentProfile);
router.put('/:id/active', setActiveEquipmentProfile);

export default router;

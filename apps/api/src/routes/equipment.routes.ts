import { Router } from 'express';
import {
  getEquipmentProfiles,
  createEquipmentProfile,
  setActiveEquipmentProfile,
} from '../controllers/equipment.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createEquipmentProfileSchema } from '../validators/equipment.validator';

const router = Router();
router.use(requireAuth);

router.get('/', getEquipmentProfiles);
router.post('/', validate(createEquipmentProfileSchema), createEquipmentProfile);
router.put('/:id/active', setActiveEquipmentProfile);

export default router;

import { Request, Response, NextFunction } from 'express';
import { equipmentRepository } from '../repositories/equipment.repository';

export const getEquipmentProfiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const profiles = await equipmentRepository.getProfiles(userId);
    res.json(profiles);
  } catch (err) {
    next(err);
  }
};

export const createEquipmentProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, equipment_types, is_active } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Profile name is required' });
      return;
    }
    const profile = await equipmentRepository.createProfile(userId, {
      name,
      equipment_types: equipment_types || [],
      is_active,
    });
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
};

export const setActiveEquipmentProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const profile = await equipmentRepository.setActiveProfile(id, userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

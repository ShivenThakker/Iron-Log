import { prisma } from '../lib/prisma';

export class EquipmentRepository {
  async getProfiles(userId: string) {
    return prisma.equipmentProfile.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getActiveProfile(userId: string) {
    return prisma.equipmentProfile.findFirst({
      where: { user_id: userId, is_active: true },
    });
  }

  async createProfile(userId: string, data: { name: string; equipment_types: string[]; is_active?: boolean }) {
    if (data.is_active) {
      await prisma.equipmentProfile.updateMany({
        where: { user_id: userId },
        data: { is_active: false },
      });
    }

    return prisma.equipmentProfile.create({
      data: {
        user_id: userId,
        name: data.name,
        equipment_types: JSON.stringify(data.equipment_types),
        is_active: data.is_active ?? true,
      },
    });
  }

  async setActiveProfile(id: string, userId: string) {
    await prisma.equipmentProfile.updateMany({
      where: { user_id: userId },
      data: { is_active: false },
    });

    return prisma.equipmentProfile.update({
      where: { id },
      data: { is_active: true },
    });
  }
}

export const equipmentRepository = new EquipmentRepository();

import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// singleton imported

export class ProgramRepository {
  async findAll(userId: string) {
    return prisma.workoutProgram.findMany({
      where: { user_id: userId },
      include: { workoutDays: true }
    });
  }

  async findById(id: string, userId: string) {
    return prisma.workoutProgram.findFirst({
      where: { id, user_id: userId },
      include: {
        workoutDays: {
          include: { 
            exercises: { 
              include: { exercise: true }, 
              orderBy: { sort_order: 'asc' } 
            } 
          },
          orderBy: { sort_order: 'asc' }
        }
      }
    });
  }

  async create(userId: string, data: Partial<Prisma.WorkoutProgramCreateInput>) {
    return prisma.workoutProgram.create({
      data: {
        name: data.name || 'New Program',
        schedule_days_per_week: data.schedule_days_per_week || 3,
        user: { connect: { id: userId } }
      }
    });
  }

  async update(id: string, userId: string, data: any) {
    return prisma.workoutProgram.update({
      where: { id, user_id: userId },
      data
    });
  }

  async delete(id: string, userId: string) {
    return prisma.workoutProgram.delete({
      where: { id, user_id: userId }
    });
  }
}

export const programRepository = new ProgramRepository();

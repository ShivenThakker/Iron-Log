import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';

export interface DayExerciseInput {
  exercise_id?: string;
  exercise_name?: string;
  target_sets?: number;
  target_reps?: string;
  rest_seconds?: number;
  sort_order?: number;
}

export interface DayInput {
  id?: string;
  day_name: string;
  sort_order?: number;
  exercises: DayExerciseInput[];
}

export interface CreateFullProgramInput {
  name: string;
  difficulty?: string;
  goal?: string;
  schedule_days_per_week?: number;
  is_active?: boolean;
  is_ai_generated?: boolean;
  days: DayInput[];
}

export interface SaveDayPlanInput {
  program_id?: string;
  day_name: string;
  sort_order?: number;
  repeat_weekly?: boolean;
  exercises: DayExerciseInput[];
}

export class ProgramRepository {
  async findAll(userId: string) {
    return prisma.workoutProgram.findMany({
      where: { user_id: userId },
      include: {
        workoutDays: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { updated_at: 'desc' },
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
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async getActiveProgram(userId: string) {
    let program = await prisma.workoutProgram.findFirst({
      where: { user_id: userId, is_active: true },
      include: {
        workoutDays: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!program) {
      program = await prisma.workoutProgram.findFirst({
        where: { user_id: userId },
        include: {
          workoutDays: {
            include: {
              exercises: {
                include: { exercise: true },
                orderBy: { sort_order: 'asc' },
              },
            },
            orderBy: { sort_order: 'asc' },
          },
        },
        orderBy: { updated_at: 'desc' },
      });
    }

    return program;
  }

  async setActiveProgram(userId: string, programId: string) {
    const target = await prisma.workoutProgram.findFirst({
      where: { id: programId, user_id: userId },
    });
    if (!target) {
      throw new NotFoundError('Program not found');
    }

    await prisma.workoutProgram.updateMany({
      where: { user_id: userId },
      data: { is_active: false },
    });

    return prisma.workoutProgram.update({
      where: { id: programId },
      data: { is_active: true },
      include: {
        workoutDays: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { sort_order: 'asc' },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async resolveOrCreateExercise(userId: string, exerciseName: string, tx?: Prisma.TransactionClient): Promise<string> {
    const client = tx || prisma;
    const trimmed = exerciseName.trim();
    if (!trimmed) {
      throw new Error('Exercise name cannot be empty');
    }

    // Check existing (standard exercises or custom exercises created by this user)
    const existing = await client.exercise.findFirst({
      where: {
        name: {
          equals: trimmed,
        },
        OR: [
          { is_custom: false },
          { created_by_user_id: userId },
        ],
      },
    });

    if (existing) {
      return existing.id;
    }

    // Infer primary muscle group from name if possible
    let muscle = 'Full Body';
    const lower = trimmed.toLowerCase();
    if (lower.includes('bench') || lower.includes('chest') || lower.includes('pec') || lower.includes('pushup')) {
      muscle = 'Chest';
    } else if (lower.includes('row') || lower.includes('lat') || lower.includes('pull') || lower.includes('chin')) {
      muscle = 'Back';
    } else if (lower.includes('squat') || lower.includes('lunge') || lower.includes('leg') || lower.includes('quad') || lower.includes('hamstring') || lower.includes('calf')) {
      muscle = 'Legs';
    } else if (lower.includes('shoulder') || lower.includes('press') || lower.includes('raise') || lower.includes('delt')) {
      muscle = 'Shoulders';
    } else if (lower.includes('bicep') || lower.includes('curl')) {
      muscle = 'Biceps';
    } else if (lower.includes('tricep') || lower.includes('dip') || lower.includes('pushdown')) {
      muscle = 'Triceps';
    } else if (lower.includes('crunch') || lower.includes('plank') || lower.includes('abs') || lower.includes('core')) {
      muscle = 'Core';
    }

    const created = await client.exercise.create({
      data: {
        name: trimmed,
        primary_muscle: muscle,
        equipment: 'Custom',
        exercise_type: 'reps',
        is_custom: true,
        created_by_user_id: userId,
      },
    });

    return created.id;
  }

  async createFullProgram(userId: string, data: CreateFullProgramInput) {
    const shouldActivate = data.is_active !== false;

    const program = await prisma.$transaction(async (tx) => {
      if (shouldActivate) {
        await tx.workoutProgram.updateMany({
          where: { user_id: userId },
          data: { is_active: false },
        });
      }

      const prog = await tx.workoutProgram.create({
        data: {
          user_id: userId,
          name: data.name || 'Custom Workout Plan',
          difficulty: data.difficulty || 'intermediate',
          goal: data.goal || 'hypertrophy',
          schedule_days_per_week: data.schedule_days_per_week || (data.days?.length || 3),
          is_active: shouldActivate,
          is_ai_generated: Boolean(data.is_ai_generated),
        },
      });

      if (data.days && data.days.length > 0) {
        for (let dayIdx = 0; dayIdx < data.days.length; dayIdx++) {
          const day = data.days[dayIdx];
          const createdDay = await tx.workoutDay.create({
            data: {
              program_id: prog.id,
              day_name: day.day_name || `Day ${dayIdx + 1}`,
              sort_order: day.sort_order ?? dayIdx,
            },
          });

          if (day.exercises && day.exercises.length > 0) {
            for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
              const ex = day.exercises[exIdx];
              let exerciseId = ex.exercise_id;
              if (!exerciseId && ex.exercise_name) {
                exerciseId = await this.resolveOrCreateExercise(userId, ex.exercise_name, tx);
              }

              if (exerciseId) {
                await tx.workoutDayExercise.create({
                  data: {
                    workout_day_id: createdDay.id,
                    exercise_id: exerciseId,
                    target_sets: ex.target_sets ?? 3,
                    target_reps: String(ex.target_reps ?? '8-12'),
                    rest_seconds: ex.rest_seconds ?? 90,
                    sort_order: ex.sort_order ?? exIdx,
                  },
                });
              }
            }
          }
        }
      }

      return prog;
    });

    return this.findById(program.id, userId);
  }

  async saveDayPlan(userId: string, data: SaveDayPlanInput) {
    let programId = data.program_id;

    if (programId) {
      const existingProgram = await prisma.workoutProgram.findFirst({
        where: { id: programId, user_id: userId },
      });
      if (!existingProgram) {
        throw new NotFoundError('Program not found');
      }
    } else {
      // Find active program or create one
      const active = await this.getActiveProgram(userId);
      if (active) {
        programId = active.id;
      } else {
        const created = await prisma.workoutProgram.create({
          data: {
            user_id: userId,
            name: 'Weekly Routine',
            is_active: true,
            schedule_days_per_week: 4,
          },
        });
        programId = created.id;
      }
    }

    const resolvedProgramId = programId!;

    await prisma.$transaction(async (tx) => {
      // Check if a day with the same name already exists in this program
      const existingDay = await tx.workoutDay.findFirst({
        where: {
          program_id: resolvedProgramId,
          day_name: data.day_name,
        },
      });

      let dayRecord;
      if (existingDay) {
        dayRecord = existingDay;
        // Delete old exercises to replace with new set
        await tx.workoutDayExercise.deleteMany({
          where: { workout_day_id: existingDay.id },
        });
        if (data.sort_order !== undefined) {
          dayRecord = await tx.workoutDay.update({
            where: { id: existingDay.id },
            data: { sort_order: data.sort_order },
          });
        }
      } else {
        const dayCount = await tx.workoutDay.count({
          where: { program_id: resolvedProgramId },
        });
        dayRecord = await tx.workoutDay.create({
          data: {
            program_id: resolvedProgramId,
            day_name: data.day_name,
            sort_order: data.sort_order ?? dayCount,
          },
        });
      }

      // Add exercises
      if (data.exercises && data.exercises.length > 0) {
        for (let i = 0; i < data.exercises.length; i++) {
          const ex = data.exercises[i];
          let exerciseId = ex.exercise_id;
          if (!exerciseId && ex.exercise_name) {
            exerciseId = await this.resolveOrCreateExercise(userId, ex.exercise_name, tx);
          }

          if (exerciseId) {
            await tx.workoutDayExercise.create({
              data: {
                workout_day_id: dayRecord.id,
                exercise_id: exerciseId,
                target_sets: ex.target_sets ?? 3,
                target_reps: String(ex.target_reps ?? '8-12'),
                rest_seconds: ex.rest_seconds ?? 90,
                sort_order: ex.sort_order ?? i,
              },
            });
          }
        }
      }
    });

    return this.findById(resolvedProgramId, userId);
  }

  async create(userId: string, data: Partial<Prisma.WorkoutProgramCreateInput>) {
    return prisma.workoutProgram.create({
      data: {
        name: data.name || 'New Program',
        schedule_days_per_week: data.schedule_days_per_week || 3,
        user: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    const existing = await prisma.workoutProgram.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) {
      throw new NotFoundError('Program not found');
    }

    return prisma.workoutProgram.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const existing = await prisma.workoutProgram.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) {
      throw new NotFoundError('Program not found');
    }

    return prisma.workoutProgram.delete({
      where: { id },
    });
  }
}

export const programRepository = new ProgramRepository();

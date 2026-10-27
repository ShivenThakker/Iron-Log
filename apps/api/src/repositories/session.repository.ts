import { prisma } from '../lib/prisma';
import { gamificationRepository } from './gamification.repository';
import { NotFoundError } from '../utils/errors';
import { checkAndCreatePR } from '../services/prDetection';

export function getEffectiveStreak(
  streak: { current_streak: number; last_active_date: Date | string; grace_used_this_week: boolean } | null | undefined
): number {
  if (!streak || streak.current_streak <= 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = new Date(streak.last_active_date);
  lastActive.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

  if (diffDays <= 1) {
    return streak.current_streak;
  }
  if (diffDays === 2 && !streak.grace_used_this_week) {
    return streak.current_streak; // Protected by weekly grace day
  }
  return 0; // Streak broken due to inactivity
}

export interface CreateSessionInput {
  started_at?: string | Date;
  session_date?: string | Date;
  workout_day_id?: string;
  notes?: string;
}

export interface AddSetInput {
  exercise_id: string;
  set_number: number;
  set_type?: string;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  rpe?: number;
}

export interface FinishSessionInput {
  notes?: string;
  fatigue_level?: number;
  duration_sec?: number;
  total_volume_kg?: number;
}

export interface RetroactiveSetInput {
  set_number?: number;
  weight_kg?: number;
  reps?: number;
  set_type?: string;
  rpe?: number;
  duration_seconds?: number;
}

export interface RetroactiveExerciseInput {
  exercise_id?: string;
  exercise_name?: string;
  sets: RetroactiveSetInput[];
}

export interface CreateRetroactiveSessionInput {
  date: string | Date;
  workout_name?: string;
  duration_minutes?: number;
  notes?: string;
  exercises: RetroactiveExerciseInput[];
}

export class SessionRepository {
  async createSession(userId: string, data: CreateSessionInput = {}) {
    return prisma.workoutSession.create({
      data: {
        user: { connect: { id: userId } },
        started_at: data.started_at ? new Date(data.started_at) : new Date(),
        session_date: data.session_date ? new Date(data.session_date) : new Date(),
        workoutDay: data.workout_day_id ? { connect: { id: data.workout_day_id } } : undefined,
        notes: data.notes,
      },
    });
  }

  async getSession(id: string, userId: string) {
    return prisma.workoutSession.findFirst({
      where: { id, user_id: userId },
      include: {
        exerciseSets: {
          include: {
            exercise: true,
          },
          orderBy: { set_number: 'asc' },
        },
        personalRecords: {
          include: {
            exercise: true,
          },
        },
        periodizationSuggestions: true,
      },
    });
  }

  async addSet(sessionId: string, userId: string, data: AddSetInput) {
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      throw new NotFoundError('Workout session not found');
    }

    return prisma.exerciseSet.create({
      data: {
        session_id: sessionId,
        exercise_id: data.exercise_id,
        set_number: data.set_number,
        set_type: data.set_type || 'normal',
        reps: data.reps,
        weight_kg: data.weight_kg,
        duration_seconds: data.duration_seconds,
        rpe: data.rpe,
      },
      include: {
        exercise: true,
      },
    });
  }

  async finishSession(id: string, userId: string, finishData: FinishSessionInput = {}) {
    const existing = await prisma.workoutSession.findFirst({
      where: { id, user_id: userId },
      include: { exerciseSets: true, personalRecords: true },
    });

    if (!existing) {
      throw new NotFoundError('Workout session not found');
    }

    if (existing.finished_at) {
      const calculatedVolume = existing.exerciseSets.reduce((sum, s) => {
        if (s.set_type !== 'warmup' && s.weight_kg && s.reps) {
          return sum + s.weight_kg * s.reps;
        }
        return sum;
      }, 0);
      return {
        session: existing,
        summary: {
          duration_seconds: existing.duration_seconds || 0,
          total_volume_kg: calculatedVolume,
          total_sets: existing.exerciseSets.length,
          pr_count: existing.personalRecords.length,
          xp_earned: 50 + (existing.personalRecords.length * 25),
        },
      };
    }

    const finishedAt = new Date();
    const durationSeconds = finishData.duration_sec
      ? finishData.duration_sec
      : Math.max(0, Math.round((finishedAt.getTime() - new Date(existing.started_at).getTime()) / 1000));

    const calculatedVolume = existing.exerciseSets.reduce((sum, s) => {
      if (s.set_type !== 'warmup' && s.weight_kg && s.reps) {
        return sum + s.weight_kg * s.reps;
      }
      return sum;
    }, 0);

    const totalVolume = finishData.total_volume_kg ?? calculatedVolume;

    const session = await prisma.workoutSession.update({
      where: { id },
      data: {
        finished_at: finishedAt,
        duration_seconds: durationSeconds,
        notes: finishData.notes ?? existing.notes,
      },
      include: {
        exerciseSets: {
          include: { exercise: true },
        },
        personalRecords: {
          include: { exercise: true },
        },
      },
    });

    await gamificationRepository.awardXp(userId, 50, 'Completed Workout Session');
    await this.updateUserStreak(userId);
    const newlyUnlockedTrophies = await gamificationRepository.checkAndUnlockTrophies(userId);

    return {
      session,
      summary: {
        duration_seconds: durationSeconds,
        total_volume_kg: totalVolume,
        total_sets: existing.exerciseSets.length,
        pr_count: existing.personalRecords.length,
        xp_earned: 50 + (existing.personalRecords.length * 25),
        newly_unlocked_trophies: newlyUnlockedTrophies,
      },
    };
  }

  async updateUserStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await prisma.streak.findUnique({
      where: { user_id: userId },
    });

    if (!streak) {
      return prisma.streak.create({
        data: {
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_active_date: today,
        },
      });
    }

    const lastActive = new Date(streak.last_active_date);
    lastActive.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) {
      // Already active today
      return streak;
    } else if (diffDays === 1) {
      // Consecutive day! Increment streak
      const newStreak = streak.current_streak + 1;
      return prisma.streak.update({
        where: { user_id: userId },
        data: {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_active_date: today,
        },
      });
    } else if (diffDays === 2 && !streak.grace_used_this_week) {
      // 1 day missed, grace period saves streak!
      const newStreak = streak.current_streak + 1;
      return prisma.streak.update({
        where: { user_id: userId },
        data: {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_active_date: today,
          grace_used_this_week: true,
        },
      });
    } else {
      // Streak broken, reset to 1
      return prisma.streak.update({
        where: { user_id: userId },
        data: {
          current_streak: 1,
          last_active_date: today,
        },
      });
    }
  }

  async getSessions(userId: string) {
    return prisma.workoutSession.findMany({
      where: {
        user_id: userId,
        finished_at: { not: null },
      },
      include: {
        exerciseSets: {
          include: { exercise: true },
        },
      },
      orderBy: { started_at: 'desc' },
      take: 20,
    });
  }

  async deleteSession(id: string, userId: string) {
    const session = await prisma.workoutSession.findFirst({
      where: { id, user_id: userId },
    });
    if (!session) {
      throw new NotFoundError('Workout session not found');
    }
    await prisma.exerciseSet.deleteMany({
      where: { session_id: id },
    });
    await prisma.personalRecord.deleteMany({
      where: { session_id: id },
    });
    return prisma.workoutSession.delete({
      where: { id },
    });
  }

  async createRetroactiveSession(userId: string, input: CreateRetroactiveSessionInput) {
    const sessionDate = new Date(input.date);
    const durationMinutes = input.duration_minutes || 45;
    const durationSeconds = durationMinutes * 60;
    const finishedAt = new Date(sessionDate.getTime() + durationSeconds * 1000);

    const combinedNotes = input.workout_name
      ? `${input.workout_name}${input.notes ? ' - ' + input.notes : ''}`
      : (input.notes || 'Past Workout Session');

    const session = await prisma.workoutSession.create({
      data: {
        user_id: userId,
        started_at: sessionDate,
        finished_at: finishedAt,
        session_date: sessionDate,
        duration_seconds: durationSeconds,
        notes: combinedNotes,
      },
    });

    let totalVolumeKg = 0;
    let totalSetsCount = 0;
    let prCount = 0;

    for (const exInput of input.exercises) {
      let exerciseId = exInput.exercise_id;
      if (!exerciseId && exInput.exercise_name) {
        const found = await prisma.exercise.findFirst({
          where: {
            OR: [
              { name: { equals: exInput.exercise_name, mode: 'insensitive' } },
              { name: exInput.exercise_name },
            ],
          },
        });
        if (found) {
          exerciseId = found.id;
        } else {
          const created = await prisma.exercise.create({
            data: {
              name: exInput.exercise_name,
              primary_muscle: 'Full Body',
              equipment: 'Other',
              exercise_type: 'reps',
              is_custom: true,
              created_by_user_id: userId,
            },
          });
          exerciseId = created.id;
        }
      }

      if (!exerciseId) continue;

      for (let i = 0; i < exInput.sets.length; i++) {
        const s = exInput.sets[i];
        const setNumber = s.set_number || i + 1;
        const setType = s.set_type || 'normal';
        const weight = s.weight_kg ?? 0;
        const reps = s.reps ?? 0;

        await prisma.exerciseSet.create({
          data: {
            session_id: session.id,
            exercise_id: exerciseId,
            set_number: setNumber,
            set_type: setType,
            weight_kg: weight,
            reps: reps,
            duration_seconds: s.duration_seconds,
            rpe: s.rpe || 9,
            logged_at: sessionDate,
          },
        });

        totalSetsCount++;

        if (setType !== 'warmup' && weight > 0 && reps > 0) {
          totalVolumeKg += weight * reps;
          const prResult = await checkAndCreatePR(
            userId,
            exerciseId,
            weight,
            reps,
            session.id,
            sessionDate
          );
          if (prResult.isNewPR) {
            prCount++;
          }
        }
      }
    }

    const xpEarned = 50 + prCount * 25;
    await gamificationRepository.awardXp(userId, xpEarned, 'Logged Historical Workout');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(sessionDate);
    checkDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - checkDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays >= 0 && diffDays <= 1) {
      await this.updateUserStreak(userId);
    }

    const newlyUnlockedTrophies = await gamificationRepository.checkAndUnlockTrophies(userId);
    const completeSession = await this.getSession(session.id, userId);

    return {
      session: completeSession || session,
      summary: {
        duration_seconds: durationSeconds,
        total_volume_kg: totalVolumeKg,
        total_sets: totalSetsCount,
        pr_count: prCount,
        xp_earned: xpEarned,
        newly_unlocked_trophies: newlyUnlockedTrophies,
      },
    };
  }
}

export const sessionRepository = new SessionRepository();

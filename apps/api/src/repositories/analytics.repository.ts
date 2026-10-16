import { prisma } from '../lib/prisma';

export class AnalyticsRepository {
  async getWorkoutStats(userId: string) {
    const totalSessions = await prisma.workoutSession.count({ 
      where: { user_id: userId, finished_at: { not: null } } 
    });
    
    const prCount = await prisma.personalRecord.count({ 
      where: { user_id: userId } 
    });
    
    const totalSets = await prisma.exerciseSet.count({
      where: { session: { user_id: userId } }
    });

    const sessions = await prisma.workoutSession.findMany({
      where: { user_id: userId, finished_at: { not: null } },
      select: { duration_seconds: true },
    });

    const sets = await prisma.exerciseSet.findMany({
      where: { session: { user_id: userId } },
      select: { weight_kg: true, reps: true },
    });

    const totalVolumeKg = sets.reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0);
    const totalDurationSec = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    const streak = await prisma.streak.findUnique({
      where: { user_id: userId },
    });

    return {
      totalSessions,
      prCount,
      totalSets,
      totalVolumeKg,
      avgSessionDurationMin: totalSessions > 0 ? Math.round((totalDurationSec / totalSessions) / 60) : 0,
      streak: streak?.current_streak ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
    };
  }

  async getMuscleHeatmap(userId: string, days = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const sets = await prisma.exerciseSet.findMany({
      where: {
        session: { user_id: userId, started_at: { gte: sinceDate } },
      },
      include: {
        exercise: true,
      },
    });

    // Count volume and set counts per primary and secondary muscle
    const muscleVolume: Record<string, { sets: number; volume_kg: number; intensity: number }> = {
      Chest: { sets: 0, volume_kg: 0, intensity: 0 },
      Back: { sets: 0, volume_kg: 0, intensity: 0 },
      Shoulders: { sets: 0, volume_kg: 0, intensity: 0 },
      Biceps: { sets: 0, volume_kg: 0, intensity: 0 },
      Triceps: { sets: 0, volume_kg: 0, intensity: 0 },
      Quads: { sets: 0, volume_kg: 0, intensity: 0 },
      Hamstrings: { sets: 0, volume_kg: 0, intensity: 0 },
      Calves: { sets: 0, volume_kg: 0, intensity: 0 },
      Core: { sets: 0, volume_kg: 0, intensity: 0 },
      Glutes: { sets: 0, volume_kg: 0, intensity: 0 },
    };

    let maxSets = 1;

    for (const set of sets) {
      const primary = set.exercise?.primary_muscle;
      const weight = set.weight_kg || 0;
      const reps = set.reps || 0;
      const volume = weight * reps;

      if (primary && muscleVolume[primary]) {
        muscleVolume[primary].sets += 1;
        muscleVolume[primary].volume_kg += volume;
        if (muscleVolume[primary].sets > maxSets) {
          maxSets = muscleVolume[primary].sets;
        }
      }
    }

    // Normalize intensity between 0 and 1 for GymStreak heatmap coloring
    for (const muscle of Object.keys(muscleVolume)) {
      muscleVolume[muscle].intensity = Math.round((muscleVolume[muscle].sets / maxSets) * 100) / 100;
    }

    return {
      periodDays: days,
      totalWorkingSets: sets.length,
      muscles: muscleVolume,
    };
  }

  async getMuscleRadar(userId: string) {
    // 6 radar axes: Chest, Back, Shoulders, Arms, Legs, Core
    const heatmap = await this.getMuscleHeatmap(userId, 30);
    const m = heatmap.muscles;

    const armsSets = (m.Biceps?.sets || 0) + (m.Triceps?.sets || 0);
    const legsSets = (m.Quads?.sets || 0) + (m.Hamstrings?.sets || 0) + (m.Calves?.sets || 0) + (m.Glutes?.sets || 0);

    const values = [
      { axis: 'Chest', value: m.Chest?.intensity || 0, sets: m.Chest?.sets || 0 },
      { axis: 'Back', value: m.Back?.intensity || 0, sets: m.Back?.sets || 0 },
      { axis: 'Shoulders', value: m.Shoulders?.intensity || 0, sets: m.Shoulders?.sets || 0 },
      { axis: 'Arms', value: Math.min(1, armsSets / 10), sets: armsSets },
      { axis: 'Legs', value: Math.min(1, legsSets / 15), sets: legsSets },
      { axis: 'Core', value: m.Core?.intensity || 0, sets: m.Core?.sets || 0 },
    ];

    return values;
  }

  async getEquipmentDistribution(userId: string) {
    const sets = await prisma.exerciseSet.findMany({
      where: { session: { user_id: userId } },
      include: { exercise: true },
    });

    const equipmentCounts: Record<string, number> = {
      Barbell: 0,
      Dumbbell: 0,
      Cable: 0,
      Machine: 0,
      Bodyweight: 0,
    };

    let total = 0;
    for (const set of sets) {
      const eq = set.exercise?.equipment;
      if (eq && equipmentCounts[eq] !== undefined) {
        equipmentCounts[eq] += 1;
        total += 1;
      }
    }

    return Object.entries(equipmentCounts).map(([equipment, count]) => ({
      name: equipment,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }
}

export const analyticsRepository = new AnalyticsRepository();

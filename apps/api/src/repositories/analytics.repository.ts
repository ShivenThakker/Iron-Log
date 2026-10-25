import { prisma } from '../lib/prisma';
import { getEffectiveStreak } from './session.repository';

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

    const sessionAgg = await prisma.workoutSession.aggregate({
      where: { user_id: userId, finished_at: { not: null } },
      _sum: { duration_seconds: true },
    });
    const totalDurationSec = sessionAgg._sum.duration_seconds || 0;

    const volumeResult = await prisma.$queryRaw<Array<{ total_volume: number | null }>>`
      SELECT SUM(es.weight_kg * es.reps) as total_volume
      FROM ExerciseSet es
      JOIN WorkoutSession ws ON es.session_id = ws.id
      WHERE ws.user_id = ${userId}
        AND es.set_type != 'warmup'
        AND es.weight_kg IS NOT NULL
        AND es.reps IS NOT NULL
    `;
    const totalVolumeKg = Math.round(Number(volumeResult[0]?.total_volume || 0));

    const streak = await prisma.streak.findUnique({
      where: { user_id: userId },
    });

    const currentStreak = getEffectiveStreak(streak);

    return {
      totalSessions,
      prCount,
      totalSets,
      totalVolumeKg,
      avgSessionDurationMin: totalSessions > 0 ? Math.round((totalDurationSec / totalSessions) / 60) : 0,
      streak: currentStreak,
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

    // Count volume and set counts per primary muscle group
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
      Traps: { sets: 0, volume_kg: 0, intensity: 0 },
      Forearms: { sets: 0, volume_kg: 0, intensity: 0 },
      Legs: { sets: 0, volume_kg: 0, intensity: 0 },
    };

    let maxSets = 1;

    for (const set of sets) {
      const primary = set.exercise?.primary_muscle;
      const weight = set.weight_kg || 0;
      const reps = set.reps || 0;
      const volume = weight * reps;

      if (primary) {
        if (!muscleVolume[primary]) {
          muscleVolume[primary] = { sets: 0, volume_kg: 0, intensity: 0 };
        }
        muscleVolume[primary].sets += 1;
        muscleVolume[primary].volume_kg += volume;
        if (muscleVolume[primary].sets > maxSets) {
          maxSets = muscleVolume[primary].sets;
        }
      }
    }

    // Normalize intensity between 0 and 1 for heatmap coloring
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

    const armsSets = (m.Biceps?.sets || 0) + (m.Triceps?.sets || 0) + (m.Forearms?.sets || 0);
    const legsSets = (m.Quads?.sets || 0) + (m.Hamstrings?.sets || 0) + (m.Calves?.sets || 0) + (m.Glutes?.sets || 0) + (m.Legs?.sets || 0);

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
    const distribution = await prisma.$queryRaw<Array<{ equipment: string; count: bigint | number }>>`
      SELECT e.equipment as equipment, COUNT(es.id) as count
      FROM ExerciseSet es
      JOIN Exercise e ON es.exercise_id = e.id
      JOIN WorkoutSession ws ON es.session_id = ws.id
      WHERE ws.user_id = ${userId}
        AND e.equipment IS NOT NULL
      GROUP BY e.equipment
    `;

    const equipmentCounts: Record<string, number> = {
      Barbell: 0,
      Dumbbell: 0,
      Cable: 0,
      Machine: 0,
      Bodyweight: 0,
    };

    let total = 0;
    for (const row of distribution) {
      const eq = row.equipment;
      const count = Number(row.count);
      equipmentCounts[eq] = (equipmentCounts[eq] || 0) + count;
      total += count;
    }

    return Object.entries(equipmentCounts).map(([equipment, count]) => ({
      name: equipment,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }
}

export const analyticsRepository = new AnalyticsRepository();

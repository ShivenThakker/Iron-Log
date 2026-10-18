import { prRepository } from '../repositories/pr.repository';

export const calculateEstimated1RM = (weightKg: number, reps: number) => {
  return weightKg * (1 + reps / 30);
};

export const checkAndCreatePR = async (
  userId: string,
  exerciseId: string,
  weightKg: number,
  reps: number,
  sessionId: string
) => {
  const currentPR = await prRepository.findCurrentPR(userId, exerciseId);
  const estimated1RM = calculateEstimated1RM(weightKg, reps);

  if (!currentPR || estimated1RM > (currentPR.estimated_1rm_kg ?? 0)) {
    return prRepository.recordPersonalRecordOnce({
      userId,
      exerciseId,
      weightKg,
      reps,
      estimated1rmKg: estimated1RM,
      sessionId,
      xpAmount: 25,
    });
  }

  return { isNewPR: false };
};

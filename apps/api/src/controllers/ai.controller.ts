import { Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/gemini.service';
import { prisma } from '../lib/prisma';
import { getEffectiveStreak } from '../repositories/session.repository';
import { sanitizeUserText } from '../utils/promptGuard';

export const chatCompletion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    let userContext = '';
    if (req.user?.id) {
      // Optimized query projections: select only necessary fields, avoiding sensitive token/hash transfer
      const [user, streak, recentPrs, sessionsCount, latestWeight, recentSessions] = await Promise.all([
        prisma.user.findUnique({
          where: { id: req.user.id },
          select: { name: true, fitness_goal: true, experience_level: true, height_cm: true },
        }).catch(() => null),
        prisma.streak.findUnique({
          where: { user_id: req.user.id },
          select: { current_streak: true, longest_streak: true, last_active_date: true, grace_used_this_week: true },
        }).catch(() => null),
        prisma.personalRecord.findMany({
          where: { user_id: req.user.id },
          take: 6,
          select: {
            weight_kg: true,
            reps: true,
            exercise: { select: { name: true } },
          },
          orderBy: { weight_kg: 'desc' },
        }).catch(() => []),
        prisma.workoutSession.count({
          where: { user_id: req.user.id, finished_at: { not: null } },
        }).catch(() => 0),
        prisma.bodyWeightLog.findFirst({
          where: { user_id: req.user.id },
          select: { weight_kg: true },
          orderBy: { logged_at: 'desc' },
        }).catch(() => null),
        prisma.workoutSession.findMany({
          where: { user_id: req.user.id, finished_at: { not: null } },
          take: 5,
          orderBy: { started_at: 'desc' },
          select: {
            exerciseSets: {
              select: {
                exercise: { select: { name: true } },
              },
            },
          },
        }).catch(() => []),
      ]);

      if (user) {
        const activeStreak = getEffectiveStreak(streak);
        const safeName = sanitizeUserText(user.name || 'Athlete');
        const safeGoal = sanitizeUserText(user.fitness_goal || 'Build Muscle');
        const safeExp = sanitizeUserText(user.experience_level || 'Intermediate');
        const weightStr = latestWeight ? `${latestWeight.weight_kg}kg` : 'Not logged';
        const heightStr = user.height_cm ? `${user.height_cm}cm` : 'Not set';
        const safePrs = recentPrs
          .map((p) => `${sanitizeUserText(p.exercise?.name || 'Lift')}: ${p.weight_kg}kg (${p.reps} reps)`)
          .join(', ') || 'None yet';

        const recentLifts = Array.from(
          new Set(recentSessions.flatMap((s) => s.exerciseSets.map((es) => es.exercise?.name)).filter(Boolean))
        )
          .slice(0, 8)
          .join(', ');

        userContext = `Name: ${safeName}
Current Bodyweight: ${weightStr}
Height: ${heightStr}
Fitness Goal: ${safeGoal}
Experience Level: ${safeExp}
Completed Sessions: ${sessionsCount} workouts logged
Active Streak: ${activeStreak} days (Longest: ${streak?.longest_streak || 0} days)
All-Time Top PRs: ${safePrs}
Recent Exercises Trained: ${recentLifts || 'None recently'}`;
      }
    }

    const reply = await geminiService.getCoachResponse(message, history || [], userContext);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
};

export const analyzeWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const routine = req.body?.routine || { previousSession: 'Leg Day', setsComplete: 14, avgRpe: 8 };
    const analysis = await geminiService.analyzeRoutine(userId, routine);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
};

export const generatePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const plan = await geminiService.generatePlan({ userId, ...req.body }, req.body);
    res.json({ plan });
  } catch (err) {
    next(err);
  }
};

export const parsePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, imageBase64, mimeType } = req.body;
    if (!text && !imageBase64) {
      res.status(400).json({ error: 'Either text notes or an imageBase64 must be provided to parse workout plan' });
      return;
    }

    const program = await geminiService.parseWorkoutPlanFromInput({ text, imageBase64, mimeType });
    res.json({ program });
  } catch (err) {
    next(err);
  }
};

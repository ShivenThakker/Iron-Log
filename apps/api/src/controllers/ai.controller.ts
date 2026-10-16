import { Request, Response } from 'express';
import { geminiService } from '../services/gemini.service';
import { prisma } from '../lib/prisma';

export const chatCompletion = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    let userContext = '';
    if (req.user?.id) {
      const [user, streak, recentPrs] = await Promise.all([
        prisma.user.findUnique({
          where: { id: req.user.id },
        }).catch(() => null),
        prisma.streak.findUnique({
          where: { user_id: req.user.id },
        }).catch(() => null),
        prisma.personalRecord.findMany({
          where: { user_id: req.user.id },
          take: 3,
          include: { exercise: true },
        }).catch(() => []),
      ]);

      if (user) {
        userContext = `\n[User Context: Name: ${user.name || 'Athlete'}, Goal: ${user.fitness_goal || 'Build Muscle'}, Experience: ${user.experience_level || 'Intermediate'}, Active Streak: ${streak?.current_streak || 0} days, Recent PRs: ${recentPrs.map((p: any) => `${p.exercise?.name || 'Lift'}: ${p.weight_kg}kg`).join(', ') || 'None yet'}]`;
      }
    }

    const reply = await geminiService.getTextFeedback(message + userContext, history || []);
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const analyzeWorkout = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const mockRoutine = req.body?.routine || { previousSession: 'Leg Day', setsComplete: 14, avgRpe: 8 };
    const analysis = await geminiService.analyzeRoutine(userId, mockRoutine);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const generatePlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const plan = await geminiService.generatePlan({ userId, ...req.body }, req.body);
    res.json({ plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

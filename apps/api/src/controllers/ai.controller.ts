import { Request, Response } from 'express';
import { geminiService } from '../services/gemini.service';

export const chatCompletion = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    
    const reply = await geminiService.getTextFeedback(message, history || []);
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

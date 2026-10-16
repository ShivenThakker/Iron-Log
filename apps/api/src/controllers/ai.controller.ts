import { Request, Response } from 'express';
import { geminiService } from '../services/gemini.service';

export const chatCompletion = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    
    const reply = await geminiService.getTextFeedback(message);
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const analyzeWorkout = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const mockRoutine = { previousSession: 'Leg Day', setsComplete: 14, avgRpe: 8 };
    const analysis = await geminiService.analyzeRoutine(userId, mockRoutine);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

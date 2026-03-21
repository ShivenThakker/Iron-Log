import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sqliteAdapter } from '../lib/prisma-adapter';

const prisma = new PrismaClient({ adapter: sqliteAdapter });

export const getWorkoutStats = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    // Total sessions
    const totalSessions = await prisma.workoutSession.count({ 
      where: { user_id: userId, finished_at: { not: null } } 
    });
    
    // PRs hit
    const prCount = await prisma.personalRecord.count({ 
      where: { user_id: userId } 
    });
    
    // Total volume (placeholder approximation via sets count for MVP)
    const totalSets = await prisma.exerciseSet.count({
       where: { session: { user_id: userId } }
    });

    res.json({
       totalSessions,
       prCount,
       totalSets
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

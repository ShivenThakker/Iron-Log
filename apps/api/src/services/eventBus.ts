import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { gamificationRepository } from '../repositories/gamification.repository';

export interface SessionFinishedEvent {
  userId: string;
  sessionId: string;
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
}

export interface SetLoggedEvent {
  userId: string;
  sessionId: string;
  exerciseId: string;
  weightKg?: number;
  reps: number;
  isNewPR: boolean;
}

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  private setupListeners() {
    this.on('session.finished', async (event: SessionFinishedEvent) => {
      try {
        const unlocked = await gamificationRepository.checkAndUnlockTrophies(event.userId);
        if (unlocked.length > 0) {
          logger.info({ userId: event.userId, count: unlocked.length }, 'Trophies unlocked asynchronously');
        }
      } catch (err) {
        logger.error({ err, event }, 'Error in session.finished listener');
      }
    });

    this.on('set.logged', async (event: SetLoggedEvent) => {
      if (event.isNewPR) {
        logger.info({ userId: event.userId, exerciseId: event.exerciseId }, 'PR logged asynchronously');
      }
    });
  }
}

export const eventBus = new AppEventBus();

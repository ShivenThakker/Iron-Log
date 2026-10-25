import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

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
    this.on('session.finished', (event: SessionFinishedEvent) => {
      logger.info(
        { userId: event.userId, sessionId: event.sessionId, totalSets: event.totalSets, totalVolumeKg: event.totalVolumeKg },
        'Session finished event handled'
      );
    });

    this.on('set.logged', async (event: SetLoggedEvent) => {
      if (event.isNewPR) {
        logger.info({ userId: event.userId, exerciseId: event.exerciseId }, 'PR logged asynchronously');
      }
    });
  }
}

export const eventBus = new AppEventBus();

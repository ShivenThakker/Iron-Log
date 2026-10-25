import { api } from './api';

export interface PendingSetItem {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  setType: string;
  reps: number;
  weightKg?: number;
  timestamp: number;
}

class WorkoutSyncManager {
  private queue: PendingSetItem[] = [];
  private isSyncing = false;

  async queueOrSendSet(
    sessionId: string,
    set: {
      exerciseId: string;
      setNumber: number;
      setType: string;
      reps: number;
      weightKg?: number;
    }
  ): Promise<{ ok: boolean; isNewPR?: boolean; error?: any }> {
    const item: PendingSetItem = {
      id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      exerciseId: set.exerciseId,
      setNumber: set.setNumber,
      setType: set.setType,
      reps: set.reps,
      weightKg: set.weightKg,
      timestamp: Date.now(),
    };

    try {
      const res = await api.post(`/sessions/${sessionId}/sets`, {
        exercise_id: set.exerciseId,
        set_number: set.setNumber,
        set_type: set.setType,
        reps: set.reps,
        weight_kg: set.weightKg && set.weightKg > 0 ? set.weightKg : undefined,
      });
      return { ok: true, isNewPR: res?.data?.pr?.isNewPR };
    } catch (err) {
      // Offline or network latency: save to retry queue
      this.queue.push(item);
      return { ok: false, error: err };
    }
  }

  async flushPendingSets(): Promise<void> {
    if (this.isSyncing || this.queue.length === 0) return;
    this.isSyncing = true;

    const remaining: PendingSetItem[] = [];
    for (const item of this.queue) {
      try {
        await api.post(`/sessions/${item.sessionId}/sets`, {
          exercise_id: item.exerciseId,
          set_number: item.setNumber,
          set_type: item.setType,
          reps: item.reps,
          weight_kg: item.weightKg && item.weightKg > 0 ? item.weightKg : undefined,
        });
      } catch {
        remaining.push(item);
      }
    }
    this.queue = remaining;
    this.isSyncing = false;
  }

  async finishSession(sessionId: string): Promise<boolean> {
    await this.flushPendingSets();
    try {
      await api.put(`/sessions/${sessionId}/finish`);
      return true;
    } catch {
      return false;
    }
  }

  getPendingCount(): number {
    return this.queue.length;
  }
}

export const workoutSync = new WorkoutSyncManager();

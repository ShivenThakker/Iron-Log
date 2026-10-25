import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
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

const QUEUE_STORAGE_KEY = 'ironlog_pending_workout_sets';

async function readPersistedQueue(): Promise<PendingSetItem[]> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(QUEUE_STORAGE_KEY)
        : await SecureStore.getItemAsync(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePersistedQueue(queue: PendingSetItem[]): Promise<void> {
  try {
    const serialized = JSON.stringify(queue);
    if (Platform.OS === 'web') {
      localStorage.setItem(QUEUE_STORAGE_KEY, serialized);
    } else {
      await SecureStore.setItemAsync(QUEUE_STORAGE_KEY, serialized);
    }
  } catch {
    // Ignore storage serialization failures
  }
}

class WorkoutSyncManager {
  private queue: PendingSetItem[] = [];
  private isSyncing = false;
  private isHydrated = false;

  private async ensureHydrated(): Promise<void> {
    if (this.isHydrated) return;
    const loaded = await readPersistedQueue();
    const existingIds = new Set(this.queue.map((q) => q.id));
    for (const item of loaded) {
      if (!existingIds.has(item.id)) {
        this.queue.push(item);
      }
    }
    this.isHydrated = true;
  }

  async queueOrSendSet(
    sessionId: string,
    set: {
      exerciseId: string;
      setNumber: number;
      setType: string;
      reps: number;
      weightKg?: number;
    }
  ): Promise<{ ok: boolean; isNewPR?: boolean; error?: unknown }> {
    await this.ensureHydrated();
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
      await writePersistedQueue(this.queue);
      return { ok: false, error: err };
    }
  }

  async flushPendingSets(): Promise<void> {
    await this.ensureHydrated();
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
    await writePersistedQueue(this.queue);
    this.isSyncing = false;
  }

  async finishSession(sessionId: string): Promise<boolean> {
    await this.ensureHydrated();
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

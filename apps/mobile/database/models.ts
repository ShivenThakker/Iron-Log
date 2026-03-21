import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, nochange, relation, children } from '@nozbe/watermelondb/decorators';

export class WorkoutSession extends Model {
  static table = 'workout_sessions';
  static associations = {
    exercise_sets: { type: 'has_many', foreignKey: 'session_id' },
  } as const;

  // @ts-ignore
  @field('backend_id') backendId: string;
  // @ts-ignore
  @date('started_at') startedAt: Date;
  // @ts-ignore
  @date('finished_at') finishedAt: Date;
  // @ts-ignore
  @field('is_synced') isSynced: boolean;
  
  // @ts-ignore
  @children('exercise_sets') sets: any;
}

export class ExerciseSet extends Model {
  static table = 'exercise_sets';
  static associations = {
    workout_sessions: { type: 'belongs_to', key: 'session_id' },
  } as const;

  // @ts-ignore
  @field('backend_id') backendId: string;
  // @ts-ignore
  @nochange @field('session_id') sessionId: string;
  // @ts-ignore
  @field('exercise_id') exerciseId: string;
  // @ts-ignore
  @field('set_number') setNumber: number;
  // @ts-ignore
  @field('weight_kg') weightKg: number;
  // @ts-ignore
  @field('reps') reps: number;
  // @ts-ignore
  @field('set_type') setType: string;
  // @ts-ignore
  @field('is_synced') isSynced: boolean;
}

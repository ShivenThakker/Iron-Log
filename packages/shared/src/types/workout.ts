export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure' | 'amrap';

export interface ExerciseSetData {
  id?: string;
  session_id?: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe?: number | null;
  set_type?: SetType;
  completed_at?: string | Date;
}

export interface WorkoutSessionData {
  id?: string;
  user_id: string;
  program_id?: string | null;
  name: string;
  started_at: string | Date;
  finished_at?: string | Date | null;
  duration_sec?: number | null;
  total_volume_kg?: number | null;
  notes?: string | null;
  sets?: ExerciseSetData[];
}

export interface PersonalRecordData {
  id: string;
  user_id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  estimated_1rm_kg: number;
  session_id?: string | null;
  achieved_at: string | Date;
}

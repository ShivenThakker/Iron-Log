export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  date_of_birth?: string | Date | null;
  gender?: string | null;
  height_cm?: number | null;
  unit_system?: 'metric' | 'imperial';
  fitness_goal?: string | null;
  activity_level?: string | null;
  experience_level?: string | null;
  training_style?: string | null;
  schedule_days_per_week?: number | null;
  session_duration_min?: number | null;
  injuries?: string[] | null;
  target_weight_kg?: number | null;
  created_at?: string | Date;
}

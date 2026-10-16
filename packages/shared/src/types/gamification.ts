export interface RankTier {
  id: string;
  name: string;
  minXp: number;
}

export interface UserXpData {
  user_id: string;
  total_xp: number;
  xp_this_week: number;
  week_reset_at: string | Date;
}

export interface TrophyData {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'streak' | 'workouts' | 'milestones' | 'special';
  xp_reward: number;
  unlocked?: boolean;
  unlocked_at?: string | Date | null;
}

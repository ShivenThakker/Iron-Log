export interface Rank {
  name: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { name: 'Rookie', minXp: 0 },
  { name: 'Grinder', minXp: 251 },
  { name: 'Iron Regular', minXp: 751 },
  { name: 'Gym Rat', minXp: 1501 },
  { name: 'Beast Mode', minXp: 3001 },
  { name: 'Iron Legend', minXp: 6001 },
];

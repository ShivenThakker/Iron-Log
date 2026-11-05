import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { searchExercises } from '../utils/exerciseSearch';
import fs from 'fs';
import path from 'path';

interface ScrapedExercise {
  id?: string;
  slug?: string;
  name: string;
  url?: string;
  difficulty?: string;
  category?: string;
  mechanics?: string;
  force?: string;
  movement_pattern?: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  stabilizers?: string[];
  steps?: Array<{ step: number; name: string; text: string }>;
  instructions?: string;
  coaching_cues?: string[];
  common_mistakes?: string[];
  easier_variations?: string[];
  harder_variations?: string[];
  youtube_id?: string;
  youtube_thumbnail?: string;
  full_description?: string;
  equipment?: string;
  standardized_primary_muscle?: string;
  standardized_secondary_muscles?: string[];
  exercise_type?: string;
  default_duration_seconds?: number | null;
}

const scrapedExerciseMap = new Map<string, ScrapedExercise>();
const scrapedExerciseList: ScrapedExercise[] = [];

try {
  const possiblePaths = [
    path.resolve(process.cwd(), 'apps/api/prisma/data/exercises_chunkitup.json'),
    path.resolve(process.cwd(), 'prisma/data/exercises_chunkitup.json'),
    path.resolve(__dirname, '../../prisma/data/exercises_chunkitup.json'),
    path.resolve(__dirname, '../../../prisma/data/exercises_chunkitup.json'),
  ];
  const foundPath = possiblePaths.find((p) => fs.existsSync(p));
  if (foundPath) {
    const raw = fs.readFileSync(foundPath, 'utf-8');
    const list: ScrapedExercise[] = JSON.parse(raw);
    for (const item of list) {
      scrapedExerciseList.push(item);
      if (item.name) {
        scrapedExerciseMap.set(item.name.toLowerCase().trim(), item);
      }
      if (item.slug) {
        scrapedExerciseMap.set(item.slug.toLowerCase().trim(), item);
      }
      if (item.id) {
        scrapedExerciseMap.set(item.id.toLowerCase().trim(), item);
      }
    }
  }
} catch (e) {
  console.warn('Could not load exercises_chunkitup.json:', e);
}

function enrichExercise<
  T extends {
    name: string;
    id: string;
    instructions?: string | null;
    equipment?: string | null;
    primary_muscle?: string | null;
    secondary_muscles?: string | null;
  }
>(ex: T) {
  const scraped =
    scrapedExerciseMap.get(ex.name.toLowerCase().trim()) ||
    scrapedExerciseMap.get(ex.id.toLowerCase().trim()) ||
    null;

  if (!scraped) return ex;

  return {
    ...ex,
    instructions: ex.instructions || scraped.instructions || scraped.full_description || null,
    difficulty: scraped.difficulty || 'Intermediate',
    category: scraped.category || 'Hypertrophy',
    mechanics: scraped.mechanics || 'Compound',
    force: scraped.force || null,
    movement_pattern: scraped.movement_pattern || null,
    steps: scraped.steps || null,
    coaching_cues: scraped.coaching_cues || null,
    common_mistakes: scraped.common_mistakes || null,
    full_description: scraped.full_description || null,
    thumbnail_url: scraped.youtube_thumbnail || null,
    youtube_id: scraped.youtube_id || null,
    youtube_thumbnail: scraped.youtube_thumbnail || null,
    source_url: scraped.url || null,
    primary_muscles_detailed: scraped.primary_muscles || [ex.primary_muscle || 'General'],
    secondary_muscles_detailed:
      scraped.secondary_muscles || (ex.secondary_muscles ? JSON.parse(ex.secondary_muscles) : []),
  };
}

let cachedStandardExercises: any[] | null = null;
let lastStandardExerciseFetch = 0;
const EXERCISE_CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function getStandardExercises() {
  const now = Date.now();
  if (cachedStandardExercises && now - lastStandardExerciseFetch < EXERCISE_CACHE_TTL) {
    return cachedStandardExercises;
  }

  let dbExercises: any[] = [];
  try {
    dbExercises = await prisma.exercise.findMany({
      where: { is_custom: false },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.warn('Could not query prisma.exercise, falling back to scraped exercises:', err);
  }

  const enrichedDb = dbExercises.map((ex) => enrichExercise(ex));
  const seen = new Set<string>();
  const combined: any[] = [];

  for (const ex of enrichedDb) {
    const key = ex.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(ex);
    }
  }

  for (const scraped of scrapedExerciseList) {
    if (!scraped.name) continue;
    const key = scraped.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push({
        ...scraped,
        id: scraped.id || scraped.slug || `scraped-${scraped.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: scraped.name,
        primary_muscle: scraped.standardized_primary_muscle || scraped.primary_muscles?.[0] || 'Chest',
        secondary_muscles: JSON.stringify(scraped.standardized_secondary_muscles || scraped.secondary_muscles || []),
        equipment: scraped.equipment || 'Bodyweight',
        exercise_type: scraped.exercise_type || 'reps',
        is_custom: false,
      });
    }
  }

  cachedStandardExercises = combined;
  lastStandardExerciseFetch = now;
  return cachedStandardExercises;
}

export class ExerciseRepository {
  async findAll(userId?: string, query?: string) {
    const [standards, custom] = await Promise.all([
      getStandardExercises(),
      userId
        ? prisma.exercise.findMany({
            where: { is_custom: true, created_by_user_id: userId },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    const enrichedCustom = custom.map((ex) => enrichExercise(ex));
    const combined = [...standards, ...enrichedCustom];

    if (!query || !query.trim()) {
      const seen = new Set<string>();
      const deduplicated: any[] = [];
      for (const ex of combined) {
        const key = ex.name.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(ex);
        }
      }
      return deduplicated.sort((a, b) => a.name.localeCompare(b.name));
    }

    return searchExercises(combined, query);
  }

  async findById(id: string, userId?: string) {
    const ex = await prisma.exercise.findUnique({ where: { id } });
    if (!ex) return null;
    if (ex.is_custom && ex.created_by_user_id !== userId) {
      return null;
    }
    return enrichExercise(ex);
  }

  async createCustom(data: Prisma.ExerciseCreateInput) {
    const trimmed = data.name.trim();
    // Case-insensitive check for existing exercise
    const existing = await prisma.exercise.findFirst({
      where: {
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    if (existing) {
      return enrichExercise(existing);
    }

    // Reset cache so custom exercise can be picked up
    cachedStandardExercises = null;

    try {
      const created = await prisma.exercise.create({
        data: {
          ...data,
          name: trimmed,
        },
      });
      return enrichExercise(created);
    } catch (err: any) {
      // Handle concurrent insert / unique constraint
      const fallback = await prisma.exercise.findFirst({
        where: { name: { equals: trimmed, mode: 'insensitive' } },
      });
      if (fallback) return enrichExercise(fallback);
      throw err;
    }
  }
}

export const exerciseRepository = new ExerciseRepository();

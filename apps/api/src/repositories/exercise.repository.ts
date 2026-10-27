import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
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
}

const scrapedExerciseMap = new Map<string, ScrapedExercise>();

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
  const dbExercises = await prisma.exercise.findMany({
    where: { is_custom: false },
  });
  cachedStandardExercises = dbExercises.map((ex) => enrichExercise(ex));
  lastStandardExerciseFetch = now;
  return cachedStandardExercises;
}

export class ExerciseRepository {
  async findAll(userId?: string, query?: string) {
    if (!query && !userId) {
      return getStandardExercises();
    }

    if (!query && userId) {
      const [standards, custom] = await Promise.all([
        getStandardExercises(),
        prisma.exercise.findMany({
          where: { is_custom: true, created_by_user_id: userId },
        }),
      ]);
      const enrichedCustom = custom.map((ex) => enrichExercise(ex));
      return [...standards, ...enrichedCustom];
    }

    const ownershipFilter: Prisma.ExerciseWhereInput = userId
      ? {
          OR: [
            { is_custom: false },
            { created_by_user_id: userId },
          ],
        }
      : { is_custom: false };

    const results = await prisma.exercise.findMany({
      where: {
        AND: [
          { name: { contains: query, mode: 'insensitive' } },
          ownershipFilter,
        ],
      },
    });

    return results.map((ex) => enrichExercise(ex));
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
    return prisma.exercise.create({ data });
  }
}

export const exerciseRepository = new ExerciseRepository();

export interface SearchableExercise {
  id?: string;
  name: string;
  primary_muscle?: string | null;
  secondary_muscles?: string | string[] | null;
  equipment?: string | null;
  exercise_type?: string | null;
  [key: string]: any;
}

/**
 * Normalizes text: lowercases, converts hyphens/slashes/underscores to spaces,
 * strips special punctuation, and collapses multiple whitespace.
 */
export function normalizeString(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[-_\\/]/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stemmer for fitness terminology to equate singular and plural queries:
 * e.g., 'pushups' -> 'pushup', 'squats' -> 'squat', 'presses' -> 'press',
 * 'crunches' -> 'crunch', 'curls' -> 'curl', 'flies' -> 'fly', 'calves' -> 'calf'.
 */
export function stemWord(word: string): string {
  if (!word) return '';
  const w = word.toLowerCase();

  // Irregular fitness plurals
  if (w === 'calves') return 'calf';
  if (w === 'flies') return 'fly';

  // Words ending with -ies (e.g. flyies -> fly)
  if (w.endsWith('ies') && w.length > 4) {
    return w.slice(0, -3) + 'y';
  }

  // Words ending with -sses, -shes, -ches, -xes (e.g. presses -> press, crunches -> crunch)
  if (
    w.endsWith('sses') ||
    w.endsWith('shes') ||
    w.endsWith('ches') ||
    w.endsWith('xes')
  ) {
    return w.slice(0, -2);
  }

  // Words ending with -es where base word ends with e (e.g. raises -> raise)
  if (w.endsWith('es') && w.length > 4) {
    if (w.endsWith('ses') || w.endsWith('zes') || w.endsWith('ges')) {
      return w.slice(0, -1);
    }
    return w.slice(0, -2);
  }

  // Standard plurals ending in -s (e.g. pushups -> pushup, squats -> squat, curls -> curl)
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    return w.slice(0, -1);
  }

  return w;
}

/**
 * Computes a relevance score for an exercise given a search query.
 * Higher score = higher ranking. Returns 0 if there is no match.
 */
export function scoreExercise(
  ex: SearchableExercise,
  query: string,
  preferredMuscle?: string | null
): number {
  const normQ = normalizeString(query);
  if (!normQ) return 0;

  const compactQ = normQ.replace(/\s+/g, '');
  const qWords = normQ.split(' ').filter(Boolean);
  const stemmedQWords = qWords.map(stemWord);
  const stemmedQ = stemmedQWords.join(' ');
  const stemmedCompactQ = stemmedQ.replace(/\s+/g, '');

  const rawName = ex.name || '';
  const normName = normalizeString(rawName);
  const compactName = normName.replace(/\s+/g, '');
  const nameWords = normName.split(' ').filter(Boolean);
  const stemmedNameWords = nameWords.map(stemWord);
  const stemmedName = stemmedNameWords.join(' ');
  const stemmedCompactName = stemmedName.replace(/\s+/g, '');

  let score = 0;

  // Tier 1: Exact matches (exact name, compact name, or stemmed variation)
  if (normName === normQ || compactName === compactQ) {
    score = 10000;
  } else if (stemmedName === stemmedQ || stemmedCompactName === stemmedCompactQ) {
    score = 9800;
  }
  // Tier 2: Prefix matches on entire name (e.g., query "push" -> "Push-Up", "bench" -> "Bench Press")
  else if (normName.startsWith(normQ) || compactName.startsWith(compactQ)) {
    score = 8000;
  } else if (stemmedName.startsWith(stemmedQ) || stemmedCompactName.startsWith(stemmedCompactQ)) {
    score = 7600;
  }
  // Tier 3: First word prefix match (e.g., "Push Press" matching "push")
  else if (
    nameWords[0]?.startsWith(normQ) ||
    stemmedNameWords[0]?.startsWith(stemmedQWords[0])
  ) {
    score = 7000;
  }
  // Tier 4: Word boundary match on subsequent words (e.g., "bench" in "Cable Bench Press" or "Incline Bench Press")
  else {
    const wordIdx = nameWords.findIndex(
      (w, i) =>
        i > 0 &&
        (w.startsWith(normQ) ||
          (stemmedQWords[0] && stemWord(w).startsWith(stemmedQWords[0])))
    );
    if (wordIdx > 0) {
      score = 5500 - wordIdx * 200;
    }
  }

  // Tier 5: Multi-token coverage (all query words found in exercise name)
  if (score < 5000 && qWords.length > 1) {
    const allTokensMatch = stemmedQWords.every((qTok) =>
      stemmedNameWords.some((nTok) => nTok.startsWith(qTok) || nTok.includes(qTok))
    );
    if (allTokensMatch) {
      score = 4500;
    }
  }

  // Tier 6: Substring match inside exercise name
  if (score === 0) {
    if (
      normName.includes(normQ) ||
      compactName.includes(compactQ) ||
      stemmedName.includes(stemmedQ) ||
      stemmedCompactName.includes(stemmedCompactQ)
    ) {
      score = 3000;
    }
  }

  // Tier 7: Partial token match in exercise name
  if (score === 0 && qWords.length > 0) {
    const matchedTokens = stemmedQWords.filter((qTok) =>
      stemmedNameWords.some((nTok) => nTok.startsWith(qTok) || nTok.includes(qTok))
    );
    if (matchedTokens.length > 0) {
      score = Math.round(1500 * (matchedTokens.length / stemmedQWords.length));
    }
  }

  // Tier 8: Muscle or equipment match
  if (score === 0) {
    const primaryMuscle = normalizeString(ex.primary_muscle || '');
    const equipment = normalizeString(ex.equipment || '');
    if (primaryMuscle.includes(normQ) || primaryMuscle.includes(stemmedQ)) {
      score = 1200;
    } else if (equipment.includes(normQ) || equipment.includes(stemmedQ)) {
      score = 1000;
    }
  }

  if (score === 0) return 0;

  // Ratio bonus: how much of the candidate name does the query account for
  const coverageRatio = normQ.length / Math.max(normName.length, normQ.length);
  score += Math.round(coverageRatio * 400);

  // Length penalty: foundational movements are shorter (e.g. "Push-Up" vs "Weighted Single-Leg Push-Up")
  score -= Math.min(normName.length * 3, 300);

  // Optional category/preferred muscle boost
  if (preferredMuscle && preferredMuscle.toLowerCase() !== 'all exercises') {
    const pm = (ex.primary_muscle || '').toLowerCase();
    const pref = preferredMuscle.toLowerCase();
    if (pm.includes(pref) || pref.includes(pm)) {
      score += 150;
    }
  }

  return Math.max(score, 1);
}

/**
 * Filters and sorts exercises by search relevance score descending.
 * Deduplicates results by normalized exercise name.
 */
export function searchExercises<T extends SearchableExercise>(
  exercises: T[],
  query: string,
  preferredMuscle?: string | null
): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    // If no query, deduplicate and return as-is
    const seen = new Set<string>();
    return exercises.filter((e) => {
      const key = (e.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const scored: { exercise: T; score: number }[] = [];
  const seen = new Set<string>();

  for (const ex of exercises) {
    const key = (ex.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;

    const score = scoreExercise(ex, trimmed, preferredMuscle);
    if (score > 0) {
      seen.add(key);
      scored.push({ exercise: ex, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name));

  return scored.map((item) => item.exercise);
}

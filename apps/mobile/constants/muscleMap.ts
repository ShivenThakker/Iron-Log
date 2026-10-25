/**
 * Mapping between Backend Muscle Names (from exercises, analytics, seed data)
 * and the 18 SVG anatomical regions defined in BODY_REGIONS.
 */

export const MUSCLE_TO_REGIONS_MAP: Record<string, string[]> = {
  // Chest
  chest: ['front-chest'],
  pecs: ['front-chest'],

  // Back
  back: ['back-upper-back', 'back-lower-back', 'back-traps'],
  'upper back': ['back-upper-back'],
  upper_back: ['back-upper-back'],
  upperback: ['back-upper-back'],
  lats: ['back-upper-back'],
  'lower back': ['back-lower-back'],
  lower_back: ['back-lower-back'],
  lowerback: ['back-lower-back'],

  // Traps
  traps: ['front-traps', 'back-traps'],
  trapezius: ['front-traps', 'back-traps'],

  // Shoulders & Delts
  shoulders: ['front-shoulders', 'back-shoulders'],
  delts: ['front-shoulders', 'back-shoulders'],
  'rear delts': ['back-shoulders'],
  rear_delts: ['back-shoulders'],
  reardelts: ['back-shoulders'],

  // Arms
  biceps: ['front-biceps'],
  triceps: ['back-triceps'],
  arms: ['front-biceps', 'back-triceps', 'front-forearms', 'back-forearms'],
  forearms: ['front-forearms', 'back-forearms'],

  // Core & Abdominals
  core: ['front-abs', 'front-obliques'],
  abs: ['front-abs'],
  abdominals: ['front-abs'],
  obliques: ['front-obliques'],

  // Lower Body
  quads: ['front-quads'],
  quadriceps: ['front-quads'],
  hamstrings: ['back-hamstrings'],
  glutes: ['back-glutes'],
  calves: ['front-calves', 'back-calves'],
  legs: ['front-quads', 'back-hamstrings', 'back-glutes', 'front-calves', 'back-calves'],
};

/**
 * Normalizes a muscle key to lower-case trimmed string
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[-_]/g, ' ');
}

/**
 * Returns the region identifiers for a given backend muscle name.
 */
export function getRegionsForMuscle(muscle: string): string[] {
  const normalized = normalizeKey(muscle);
  if (MUSCLE_TO_REGIONS_MAP[normalized]) {
    return MUSCLE_TO_REGIONS_MAP[normalized];
  }
  const compact = normalized.replace(/\s+/g, '');
  if (MUSCLE_TO_REGIONS_MAP[compact]) {
    return MUSCLE_TO_REGIONS_MAP[compact];
  }
  return [];
}

/**
 * Converts a backend muscle volume/intensity dictionary into region intensities (0..1).
 * If a region is mapped from multiple muscles (e.g. Back and Traps both mapping to back-traps),
 * it takes the maximum intensity.
 */
export function mapHeatmapToRegionIntensities(
  muscleData: Record<string, number | { intensity?: number } | undefined | null>
): Record<string, number> {
  const regionIntensities: Record<string, number> = {};

  if (!muscleData || typeof muscleData !== 'object') {
    return regionIntensities;
  }

  for (const [muscle, val] of Object.entries(muscleData)) {
    if (val === undefined || val === null) continue;
    const intensity = typeof val === 'number' ? val : (val.intensity ?? 0);
    if (intensity <= 0) continue;

    const regions = getRegionsForMuscle(muscle);
    for (const region of regions) {
      regionIntensities[region] = Math.max(regionIntensities[region] || 0, intensity);
    }
  }

  return regionIntensities;
}

export default MUSCLE_TO_REGIONS_MAP;

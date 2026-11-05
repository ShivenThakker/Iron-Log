import { describe, it, expect } from 'vitest';
import {
  normalizeString,
  stemWord,
  scoreExercise,
  searchExercises,
} from '../src/utils/exerciseSearch';

describe('Exercise Search Utility', () => {
  describe('normalizeString', () => {
    it('normalizes hyphens, slashes, uppercase, and punctuation', () => {
      expect(normalizeString('Push-Up')).toBe('push up');
      expect(normalizeString('Close_Grip/Bench   Press!')).toBe('close grip bench press');
      expect(normalizeString('T-Bar Row')).toBe('t bar row');
    });

    it('handles empty or null strings', () => {
      expect(normalizeString('')).toBe('');
      expect(normalizeString(null)).toBe('');
      expect(normalizeString(undefined)).toBe('');
    });
  });

  describe('stemWord', () => {
    it('stems common fitness plurals', () => {
      expect(stemWord('pushups')).toBe('pushup');
      expect(stemWord('squats')).toBe('squat');
      expect(stemWord('curls')).toBe('curl');
      expect(stemWord('presses')).toBe('press');
      expect(stemWord('crunches')).toBe('crunch');
      expect(stemWord('raises')).toBe('raise');
      expect(stemWord('rows')).toBe('row');
      expect(stemWord('calves')).toBe('calf');
      expect(stemWord('flies')).toBe('fly');
    });

    it('preserves non-plural words', () => {
      expect(stemWord('push')).toBe('push');
      expect(stemWord('press')).toBe('press');
      expect(stemWord('bench')).toBe('bench');
    });
  });

  describe('Relevance Ranking Requirements', () => {
    const library = [
      { name: 'Archer Push-Up', primary_muscle: 'Chest', equipment: 'Bodyweight' },
      { name: 'Band Push-up', primary_muscle: 'Chest', equipment: 'Band' },
      { name: 'Push-Up', primary_muscle: 'Chest', equipment: 'Bodyweight' },
      { name: 'Incline Push-up', primary_muscle: 'Chest', equipment: 'Bodyweight' },
      { name: 'Diamond Push-Up', primary_muscle: 'Triceps', equipment: 'Bodyweight' },
      { name: 'Push Press', primary_muscle: 'Shoulders', equipment: 'Barbell' },
      { name: 'Bench Press', primary_muscle: 'Chest', equipment: 'Barbell' },
      { name: 'Close-Grip Bench Press', primary_muscle: 'Triceps', equipment: 'Barbell' },
      { name: 'Incline Bench Press', primary_muscle: 'Chest', equipment: 'Barbell' },
      { name: 'Dumbbell Bench Press', primary_muscle: 'Chest', equipment: 'Dumbbell' },
      { name: 'Cable Bench Press', primary_muscle: 'Chest', equipment: 'Cable' },
      { name: 'Flat Bench Crunches', primary_muscle: 'Core', equipment: 'Bodyweight' },
      { name: 'Pull-Up', primary_muscle: 'Back', equipment: 'Bodyweight' },
      { name: 'Archer Pull-Up', primary_muscle: 'Back', equipment: 'Bodyweight' },
      { name: 'Chin-Up', primary_muscle: 'Back', equipment: 'Bodyweight' },
      { name: 'Dumbbell Bicep Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell' },
      { name: 'Hammer Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell' },
      { name: 'Barbell Squat', primary_muscle: 'Legs', equipment: 'Barbell' },
      { name: 'Squat Jump', primary_muscle: 'Legs', equipment: 'Bodyweight' },
    ];

    it('ranks standard Push-Up first when searching "pushup"', () => {
      const results = searchExercises(library, 'pushup');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Push-Up');
    });

    it('ranks standard Push-Up first when searching plural "pushups"', () => {
      const results = searchExercises(library, 'pushups');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Push-Up');
    });

    it('ranks Push-Up above Archer Push-Up and Incline Push-Up when searching "push"', () => {
      const results = searchExercises(library, 'push');
      expect(results.length).toBeGreaterThan(3);
      expect(results[0].name).toBe('Push-Up');
      expect(results[1].name).toBe('Push Press');

      const pushUpIdx = results.findIndex((e) => e.name === 'Push-Up');
      const archerIdx = results.findIndex((e) => e.name === 'Archer Push-Up');
      const inclineIdx = results.findIndex((e) => e.name === 'Incline Push-up');

      expect(pushUpIdx).toBeLessThan(archerIdx);
      expect(pushUpIdx).toBeLessThan(inclineIdx);
    });

    it('ranks Bench Press first when searching "bench", and includes secondary-word matches like Cable Bench Press', () => {
      const results = searchExercises(library, 'bench');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Bench Press');

      const names = results.map((e) => e.name);
      expect(names).toContain('Cable Bench Press');
      expect(names).toContain('Incline Bench Press');
      expect(names).toContain('Dumbbell Bench Press');
      expect(names).toContain('Close-Grip Bench Press');
      expect(names).toContain('Flat Bench Crunches');
    });

    it('ranks Cable Bench Press first when searching "cable bench press"', () => {
      const results = searchExercises(library, 'cable bench press');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Cable Bench Press');
    });

    it('ranks Pull-Up first when searching "pullups" and Chin-Up first when searching "chinups"', () => {
      const pullResults = searchExercises(library, 'pullups');
      expect(pullResults[0].name).toBe('Pull-Up');

      const chinResults = searchExercises(library, 'chinups');
      expect(chinResults[0].name).toBe('Chin-Up');
    });

    it('matches exercises when searching plural queries like "squats" and "curls"', () => {
      const squatResults = searchExercises(library, 'squats');
      const squatNames = squatResults.map((e) => e.name);
      expect(squatNames).toContain('Barbell Squat');
      expect(squatNames).toContain('Squat Jump');

      const curlResults = searchExercises(library, 'curls');
      const curlNames = curlResults.map((e) => e.name);
      expect(curlNames).toContain('Dumbbell Bicep Curl');
      expect(curlNames).toContain('Hammer Curl');
    });

    it('applies category boost when preferredMuscle is specified', () => {
      const chestResults = searchExercises(library, 'bench', 'Chest');
      const coreResults = searchExercises(library, 'bench', 'Core');

      const chestCrunchIdx = chestResults.findIndex((e) => e.name === 'Flat Bench Crunches');
      const coreCrunchIdx = coreResults.findIndex((e) => e.name === 'Flat Bench Crunches');

      expect(coreCrunchIdx).toBeLessThan(chestCrunchIdx);
    });
  });
});

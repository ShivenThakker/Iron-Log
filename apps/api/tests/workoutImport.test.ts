import { describe, it, expect } from 'vitest';
import { parseSetString, parseDateValue, WorkoutImportService } from '../src/services/workoutImport.service';

describe('workoutImport.service unit tests', () => {
  describe('parseSetString', () => {
    it('parses standard weight and reps formatted string', () => {
      const res = parseSetString('80 - 10 and 85 - 8');
      expect(res.sets).toHaveLength(2);
      expect(res.sets[0]).toMatchObject({
        set_number: 1,
        weight_kg: 80,
        reps: 10,
        set_type: 'normal',
      });
      expect(res.sets[1]).toMatchObject({
        set_number: 2,
        weight_kg: 85,
        reps: 8,
        set_type: 'normal',
      });
    });

    it('parses failure flags and notes', () => {
      const res = parseSetString('100kg - 6 reps - F (felt heavy)');
      expect(res.sets).toHaveLength(1);
      expect(res.sets[0]).toMatchObject({
        set_number: 1,
        weight_kg: 100,
        reps: 6,
        rpe: 10,
        set_type: 'failure',
      });
      expect(res.notes).toContain('felt heavy');
    });

    it('parses dead hang seconds format', () => {
      const res = parseSetString('30s and 25s');
      expect(res.sets).toHaveLength(2);
      expect(res.sets[0]).toMatchObject({
        set_number: 1,
        duration_seconds: 30,
        weight_kg: 0,
        reps: 1,
      });
      expect(res.sets[1]).toMatchObject({
        set_number: 2,
        duration_seconds: 25,
        weight_kg: 0,
        reps: 1,
      });
    });

    it('parses round of 20 format', () => {
      const res = parseSetString('12 and 10 round of 20');
      expect(res.sets).toHaveLength(2);
      expect(res.sets[0]).toMatchObject({
        set_number: 1,
        weight_kg: 12,
        reps: 20,
      });
      expect(res.sets[1]).toMatchObject({
        set_number: 2,
        weight_kg: 10,
        reps: 20,
      });
    });

    it('handles empty or blank string gracefully', () => {
      const res = parseSetString('');
      expect(res.sets).toEqual([]);
      expect(res.notes).toBe('');
    });
  });

  describe('parseDateValue', () => {
    it('parses ISO dates', () => {
      const d = parseDateValue('2026-03-15');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2); // March is 2
      expect(d.getDate()).toBe(15);
    });

    it('parses DD/MM/YYYY dates', () => {
      const d = parseDateValue('18/04/2026');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(3); // April is 3
      expect(d.getDate()).toBe(18);
    });

    it('parses Excel serial numbers', () => {
      // 45338 corresponds to 2024-02-16 approx
      const d = parseDateValue(45338);
      expect(d.getFullYear()).toBeGreaterThanOrEqual(2024);
    });
  });

  describe('retroactiveSessionSchema validation', () => {
    it('accepts payload with date field and failure set_type', async () => {
      const { retroactiveSessionSchema } = await import('../src/validators/session.validator');
      const payload = {
        date: new Date().toISOString(),
        workout_name: 'Chest & Back Hypertrophy',
        duration_minutes: 45,
        exercises: [
          {
            exercise_name: 'Incline Bench Press',
            sets: [
              { set_number: 1, weight_kg: 7.5, reps: 20, set_type: 'failure', rpe: 10 },
              { set_number: 2, weight_kg: 7.5, reps: 20, set_type: 'failure', rpe: 10 },
            ],
          },
        ],
      };
      const result = retroactiveSessionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('accepts payload with session_date field', async () => {
      const { retroactiveSessionSchema } = await import('../src/validators/session.validator');
      const payload = {
        session_date: new Date().toISOString(),
        exercises: [
          {
            exercise_name: 'Dumbbell Wrist Curls',
            sets: [{ set_number: 1, weight_kg: 5, reps: 20 }],
          },
        ],
      };
      const result = retroactiveSessionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects payload when no date is supplied with clear message', async () => {
      const { retroactiveSessionSchema } = await import('../src/validators/session.validator');
      const payload = {
        workout_name: 'No date workout',
        exercises: [
          {
            exercise_name: 'Bench Press',
            sets: [{ set_number: 1, weight_kg: 60, reps: 10 }],
          },
        ],
      };
      const result = retroactiveSessionSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Session date is required');
      }
    });
  });
});

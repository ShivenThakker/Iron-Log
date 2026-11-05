import { describe, it, expect, vi } from 'vitest';
import { getDefaultSplitPlan } from '../src/services/gemini.fallbacks';
import { geminiService } from '../src/services/gemini.service';

describe('Plan Generation & Split Templates', () => {
  it('generates a complete Push / Pull / Legs routine with full workout days', () => {
    const plan = getDefaultSplitPlan({
      split_preference: 'Push / Pull / Legs',
      days_per_week: 5,
      fitness_goal: 'Build Muscle',
    });

    expect(plan.name).toContain('Push / Pull / Legs');
    expect(plan.days).toHaveLength(7);

    // Filter active days
    const activeDays = plan.days.filter((d) => d.exercises.length > 0);
    expect(activeDays.length).toBeGreaterThanOrEqual(4);

    // Each active day must have 5 or 6 exercises
    for (const day of activeDays) {
      expect(day.exercises.length).toBeGreaterThanOrEqual(5);
      for (const ex of day.exercises) {
        expect(ex.exercise_name).toBeTruthy();
        expect(ex.target_sets).toBeGreaterThanOrEqual(3);
        expect(ex.target_reps).toBeTruthy();
        expect(ex.rest_seconds).toBeGreaterThan(0);
      }
    }
  });

  it('generates a complete Upper / Lower split with full workout days', () => {
    const plan = getDefaultSplitPlan({
      split_preference: 'Upper / Lower',
      days_per_week: 4,
      fitness_goal: 'Strength',
    });

    expect(plan.name).toContain('Upper / Lower');
    expect(plan.days).toHaveLength(7);

    const activeDays = plan.days.filter((d) => d.exercises.length > 0);
    expect(activeDays).toHaveLength(4);

    for (const day of activeDays) {
      expect(day.exercises.length).toBe(6);
    }
  });

  it('generates a complete Full Body split with 3 workout days', () => {
    const plan = getDefaultSplitPlan({
      split_preference: 'Full Body',
      days_per_week: 3,
      fitness_goal: 'General Fitness',
    });

    expect(plan.name).toContain('Full Body');
    expect(plan.days).toHaveLength(7);

    const activeDays = plan.days.filter((d) => d.exercises.length > 0);
    expect(activeDays).toHaveLength(3);

    for (const day of activeDays) {
      expect(day.exercises.length).toBe(6);
    }
  });

  it('generates a complete Arnold Split with 5 workout days', () => {
    const plan = getDefaultSplitPlan({
      split_preference: 'Arnold Split',
      days_per_week: 5,
      fitness_goal: 'Hypertrophy',
    });

    expect(plan.name).toContain('Arnold');
    expect(plan.days).toHaveLength(7);

    const activeDays = plan.days.filter((d) => d.exercises.length > 0);
    expect(activeDays.length).toBeGreaterThanOrEqual(5);

    for (const day of activeDays) {
      expect(day.exercises.length).toBe(6);
    }
  });

  it('geminiService.generateStructuredPlan returns fallback plan when client is offline/fallback', async () => {
    vi.spyOn(geminiService as any, 'getClient').mockReturnValue(null);

    const plan = await geminiService.generateStructuredPlan(
      { userId: 'test-user' },
      { split_preference: 'Push / Pull / Legs', days_per_week: 5 }
    );

    expect(plan.is_active).toBe(true);
    expect(plan.days).toBeDefined();
    expect(plan.days.length).toBe(7);

    const activeDays = plan.days.filter((d: any) => d.exercises && d.exercises.length > 0);
    expect(activeDays.length).toBeGreaterThanOrEqual(4);
    for (const day of activeDays) {
      expect(day.exercises.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('geminiService.generateStructuredPlan parses and adapts valid AI response', async () => {
    const mockAiResponse = JSON.stringify({
      name: 'AI Elite Push Pull Legs',
      difficulty: 'advanced',
      goal: 'Hypertrophy',
      schedule_days_per_week: 5,
      days: [
        {
          day_name: 'Monday – Push',
          sort_order: 0,
          exercises: [
            { exercise_name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
            { exercise_name: 'Incline Dumbbell Press', target_sets: 4, target_reps: '10-12', rest_seconds: 90 },
            { exercise_name: 'Dumbbell Side Raises', target_sets: 4, target_reps: '15', rest_seconds: 60 },
            { exercise_name: 'Triceps Pushdown', target_sets: 3, target_reps: '12', rest_seconds: 60 },
            { exercise_name: 'Pec Deck Fly', target_sets: 3, target_reps: '15', rest_seconds: 60 },
          ],
        },
        {
          day_name: 'Tuesday – Pull',
          sort_order: 1,
          exercises: [
            { exercise_name: 'Lat Pulldown', target_sets: 4, target_reps: '10-12', rest_seconds: 90 },
            { exercise_name: 'Seated Row', target_sets: 4, target_reps: '10-12', rest_seconds: 90 },
            { exercise_name: 'Dumbbell Bicep Curl', target_sets: 4, target_reps: '12', rest_seconds: 60 },
            { exercise_name: 'Hammer Curl', target_sets: 3, target_reps: '12', rest_seconds: 60 },
            { exercise_name: 'Pec Deck Reverse Fly', target_sets: 3, target_reps: '15', rest_seconds: 60 },
          ],
        },
        {
          day_name: 'Wednesday – Legs',
          sort_order: 2,
          exercises: [
            { exercise_name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
            { exercise_name: 'Romanian Deadlifts', target_sets: 4, target_reps: '10', rest_seconds: 90 },
            { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '15', rest_seconds: 60 },
            { exercise_name: 'Leg Curl Machine', target_sets: 3, target_reps: '12', rest_seconds: 60 },
            { exercise_name: 'Standing Calf Raises', target_sets: 4, target_reps: '20', rest_seconds: 45 },
          ],
        },
        { day_name: 'Thursday – Rest', sort_order: 3, exercises: [] },
        { day_name: 'Friday – Rest', sort_order: 4, exercises: [] },
        { day_name: 'Saturday – Rest', sort_order: 5, exercises: [] },
        { day_name: 'Sunday – Rest', sort_order: 6, exercises: [] },
      ],
    });

    vi.spyOn(geminiService as any, 'getClient').mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: mockAiResponse }),
      },
    });

    const plan = await geminiService.generateStructuredPlan(
      { userId: 'test-user' },
      { split_preference: 'Push / Pull / Legs', days_per_week: 3 }
    );

    expect(plan.name).toBe('AI Elite Push Pull Legs');
    expect(plan.days[0].exercises).toHaveLength(5);
    expect(plan.days[1].exercises).toHaveLength(5);
    expect(plan.days[2].exercises).toHaveLength(5);
  });
});


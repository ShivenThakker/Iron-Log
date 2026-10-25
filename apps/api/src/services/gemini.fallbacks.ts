export type FallbackKind = 'coachChat' | 'routineAnalysis' | 'routineAnalysisError' | 'planGeneration';

const FALLBACKS: Record<FallbackKind, string> = {
  coachChat:
    'IronLog AI is in offline demo mode. Set GEMINI_API_KEY and GEMINI_MODEL in your environment to enable real-time coaching responses.',
  routineAnalysis:
    '• Focus on gradual weight increases (2.5kg)\n• Balance push and pull volume across the week\n• Ensure 48 hours recovery before training the same muscle group',
  routineAnalysisError:
    '• Prioritize progressive overload by adding 1 rep or small weight next session\n• Ensure full range of motion on compound lifts\n• Maintain 1-2 RIR (reps in reserve) on working sets',
  planGeneration: JSON.stringify({
    program_name: 'Custom Foundation Hypertrophy',
    split_type: 'Upper / Lower',
    description: 'Balanced 4-day split emphasizing compound lifts and progressive overload.',
    weekly_schedule: [
      { day: 'Day 1', workout: 'Upper Body A', focus: 'Chest, Back, Arms' },
      { day: 'Day 2', workout: 'Lower Body A', focus: 'Quads, Hamstrings, Calves' },
      { day: 'Day 3', workout: 'Rest', focus: 'Recovery' },
      { day: 'Day 4', workout: 'Upper Body B', focus: 'Shoulders, Back, Arms' },
      { day: 'Day 5', workout: 'Lower Body B', focus: 'Glutes, Hamstrings, Core' },
      { day: 'Day 6', workout: 'Rest', focus: 'Recovery' },
      { day: 'Day 7', workout: 'Rest', focus: 'Recovery' },
    ],
  }),
};

export function getFallbackResponse(kind: FallbackKind): string {
  return FALLBACKS[kind];
}

export function getDefaultParsedPlan(rawText?: string) {
  return {
    program_name: rawText ? rawText.slice(0, 30).trim() : 'Custom Parsed Routine',
    difficulty: 'intermediate' as const,
    schedule_days_per_week: 3,
    description:
      'Auto-parsed workout plan (Demo Mode). Set GEMINI_API_KEY and GEMINI_MODEL to enable live parsing.',
    days: [
      {
        day_name: 'Push Day (Chest, Shoulders, Triceps)',
        exercises: [
          { name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
          { name: 'Incline Bench Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
          { name: 'Dumbbell Overhead Press', target_sets: 3, target_reps: '10', rest_seconds: 90 },
          { name: 'Triceps Pushdown (Straight Bar)', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
        ],
      },
      {
        day_name: 'Pull Day (Back, Biceps)',
        exercises: [
          { name: 'Lat Pulldown', target_sets: 4, target_reps: '10-12', rest_seconds: 90 },
          { name: 'Seated Row', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
          { name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '12', rest_seconds: 60 },
          { name: 'Hammer Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
        ],
      },
      {
        day_name: 'Legs & Core',
        exercises: [
          { name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
          { name: 'Romanian Deadlifts', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
          { name: 'Leg Curl Machine', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
          { name: 'Flat Bench Crunches', target_sets: 3, target_reps: '15-20', rest_seconds: 45 },
        ],
      },
    ],
  };
}

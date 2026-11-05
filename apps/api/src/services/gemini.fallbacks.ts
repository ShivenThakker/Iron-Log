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

export interface SplitPlanParams {
  split_preference?: string;
  days_per_week?: number;
  fitness_goal?: string;
  experience_level?: string;
}

export function getDefaultSplitPlan(params: SplitPlanParams) {
  const rawSplit = (params.split_preference || 'Push / Pull / Legs').toLowerCase();
  const daysPerWeek = Number(params.days_per_week) || 5;
  const goal = params.fitness_goal || 'Hypertrophy';
  const difficulty = (params.experience_level || 'intermediate').toLowerCase();

  if (rawSplit.includes('upper') && rawSplit.includes('lower')) {
    return {
      name: 'Custom Upper / Lower Split',
      difficulty,
      goal,
      schedule_days_per_week: 4,
      is_active: true,
      is_ai_generated: true,
      days: [
        {
          day_name: 'Monday – Upper Body A',
          sort_order: 0,
          exercises: [
            { exercise_name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
            { exercise_name: 'Lat Pulldown', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Incline Dumbbell Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 2 },
            { exercise_name: 'Seated Row', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 3 },
            { exercise_name: 'Dumbbell Side Raises', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Triceps Pushdown (Straight Bar)', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 5 },
          ],
        },
        {
          day_name: 'Tuesday – Lower Body A',
          sort_order: 1,
          exercises: [
            { exercise_name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
            { exercise_name: 'Romanian Deadlifts', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
            { exercise_name: 'Leg Curl Machine', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 3 },
            { exercise_name: 'Standing Calf Raises', target_sets: 4, target_reps: '15-20', rest_seconds: 45, sort_order: 4 },
            { exercise_name: 'Cable Crunches', target_sets: 3, target_reps: '12-15', rest_seconds: 45, sort_order: 5 },
          ],
        },
        {
          day_name: 'Wednesday – Rest & Active Recovery',
          sort_order: 2,
          exercises: [],
        },
        {
          day_name: 'Thursday – Upper Body B',
          sort_order: 3,
          exercises: [
            { exercise_name: 'Dumbbell Overhead Press', target_sets: 4, target_reps: '8-10', rest_seconds: 90, sort_order: 0 },
            { exercise_name: 'Assisted Chin-ups', target_sets: 4, target_reps: '6-10', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Flat Dumbbell Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 2 },
            { exercise_name: 'T Bar Row', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 3 },
            { exercise_name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Rope Overhead Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 5 },
          ],
        },
        {
          day_name: 'Friday – Lower Body B',
          sort_order: 4,
          exercises: [
            { exercise_name: 'Bulgarian Split Squats', target_sets: 3, target_reps: '8-10', rest_seconds: 90, sort_order: 0 },
            { exercise_name: 'Romanian Deadlifts', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
            { exercise_name: 'Standing Calf Raises', target_sets: 4, target_reps: '15-20', rest_seconds: 45, sort_order: 3 },
            { exercise_name: 'Flat Bench Crunches', target_sets: 3, target_reps: '15-20', rest_seconds: 45, sort_order: 4 },
            { exercise_name: 'Dead Hang', target_sets: 3, target_reps: '45-60s', rest_seconds: 45, sort_order: 5 },
          ],
        },
        {
          day_name: 'Saturday – Rest & Mobility',
          sort_order: 5,
          exercises: [],
        },
        {
          day_name: 'Sunday – Rest & Recovery',
          sort_order: 6,
          exercises: [],
        },
      ],
    };
  }

  if (rawSplit.includes('full')) {
    return {
      name: 'Custom Full Body Split',
      difficulty,
      goal,
      schedule_days_per_week: 3,
      is_active: true,
      is_ai_generated: true,
      days: [
        {
          day_name: 'Monday – Full Body A (Squat & Press Focus)',
          sort_order: 0,
          exercises: [
            { exercise_name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
            { exercise_name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 1 },
            { exercise_name: 'Lat Pulldown', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 2 },
            { exercise_name: 'Dumbbell Side Raises', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
            { exercise_name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Triceps Pushdown (Straight Bar)', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 5 },
          ],
        },
        {
          day_name: 'Tuesday – Rest & Mobility',
          sort_order: 1,
          exercises: [],
        },
        {
          day_name: 'Wednesday – Full Body B (Hinge & Pull Focus)',
          sort_order: 2,
          exercises: [
            { exercise_name: 'Romanian Deadlifts', target_sets: 4, target_reps: '8-10', rest_seconds: 90, sort_order: 0 },
            { exercise_name: 'Incline Dumbbell Press', target_sets: 4, target_reps: '10-12', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Seated Row', target_sets: 4, target_reps: '10-12', rest_seconds: 90, sort_order: 2 },
            { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
            { exercise_name: 'Rope Overhead Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Cable Crunches', target_sets: 3, target_reps: '12-15', rest_seconds: 45, sort_order: 5 },
          ],
        },
        {
          day_name: 'Thursday – Rest & Active Recovery',
          sort_order: 3,
          exercises: [],
        },
        {
          day_name: 'Friday – Full Body C (Hypertrophy & Pump)',
          sort_order: 4,
          exercises: [
            { exercise_name: 'Bulgarian Split Squats', target_sets: 3, target_reps: '8-10', rest_seconds: 90, sort_order: 0 },
            { exercise_name: 'Dumbbell Overhead Press', target_sets: 4, target_reps: '8-10', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Assisted Chin-ups', target_sets: 3, target_reps: '6-10', rest_seconds: 90, sort_order: 2 },
            { exercise_name: 'Pec Deck Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
            { exercise_name: 'Hammer Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Standing Calf Raises', target_sets: 4, target_reps: '15-20', rest_seconds: 45, sort_order: 5 },
          ],
        },
        {
          day_name: 'Saturday – Rest & Mobility',
          sort_order: 5,
          exercises: [],
        },
        {
          day_name: 'Sunday – Rest & Recovery',
          sort_order: 6,
          exercises: [],
        },
      ],
    };
  }

  if (rawSplit.includes('arnold')) {
    return {
      name: 'Custom Arnold Schwarzenegger Split',
      difficulty,
      goal,
      schedule_days_per_week: 5,
      is_active: true,
      is_ai_generated: true,
      days: [
        {
          day_name: 'Monday – Chest & Back A',
          sort_order: 0,
          exercises: [
            { exercise_name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
            { exercise_name: 'Lat Pulldown', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Incline Dumbbell Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 2 },
            { exercise_name: 'Seated Row', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 3 },
            { exercise_name: 'Pec Deck Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Assisted Chin-ups', target_sets: 3, target_reps: '6-10', rest_seconds: 90, sort_order: 5 },
          ],
        },
        {
          day_name: 'Tuesday – Shoulders & Arms A',
          sort_order: 1,
          exercises: [
            { exercise_name: 'Dumbbell Overhead Press', target_sets: 4, target_reps: '8-10', rest_seconds: 90, sort_order: 0 },
            { exercise_name: 'Dumbbell Side Raises', target_sets: 4, target_reps: '12-15', rest_seconds: 60, sort_order: 1 },
            { exercise_name: 'Pec Deck Reverse Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
            { exercise_name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 3 },
            { exercise_name: 'Triceps Pushdown (Straight Bar)', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Hammer Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 5 },
          ],
        },
        {
          day_name: 'Wednesday – Legs & Core A',
          sort_order: 2,
          exercises: [
            { exercise_name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
            { exercise_name: 'Romanian Deadlifts', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
            { exercise_name: 'Leg Curl Machine', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 3 },
            { exercise_name: 'Standing Calf Raises', target_sets: 4, target_reps: '15-20', rest_seconds: 45, sort_order: 4 },
            { exercise_name: 'Cable Crunches', target_sets: 3, target_reps: '12-15', rest_seconds: 45, sort_order: 5 },
          ],
        },
        {
          day_name: 'Thursday – Chest & Back B',
          sort_order: 3,
          exercises: [
            { exercise_name: 'Incline Chest Press Machine', target_sets: 4, target_reps: '10-12', rest_seconds: 90, sort_order: 0 },
            { exercise_name: 'T Bar Row', target_sets: 4, target_reps: '8-10', rest_seconds: 90, sort_order: 1 },
            { exercise_name: 'Flat Dumbbell Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 2 },
            { exercise_name: 'Lat Pulldown', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 3 },
            { exercise_name: 'Pec Deck Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Dead Hang', target_sets: 3, target_reps: '45-60s', rest_seconds: 45, sort_order: 5 },
          ],
        },
        {
          day_name: 'Friday – Shoulders & Arms B',
          sort_order: 4,
          exercises: [
            { exercise_name: 'Dumbbell Side Raises', target_sets: 4, target_reps: '12-15', rest_seconds: 60, sort_order: 0 },
            { exercise_name: 'Machine Shrugs', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 1 },
            { exercise_name: 'Rope Overhead Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
            { exercise_name: 'Bayesian Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
            { exercise_name: 'Tricep Dips', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 4 },
            { exercise_name: 'Dumbbell Wrist Curls (Palms Up)', target_sets: 3, target_reps: '15-20', rest_seconds: 45, sort_order: 5 },
          ],
        },
        {
          day_name: 'Saturday – Rest & Active Recovery',
          sort_order: 5,
          exercises: [],
        },
        {
          day_name: 'Sunday – Rest & Recovery',
          sort_order: 6,
          exercises: [],
        },
      ],
    };
  }

  // Default: Push / Pull / Legs (PPL)
  const is3Day = daysPerWeek === 3;
  return {
    name: 'Custom Push / Pull / Legs Split',
    difficulty,
    goal,
    schedule_days_per_week: is3Day ? 3 : daysPerWeek,
    is_active: true,
    is_ai_generated: true,
    days: [
      {
        day_name: 'Monday – Push (Chest, Front/Side Delts, Triceps)',
        sort_order: 0,
        exercises: [
          { exercise_name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
          { exercise_name: 'Incline Dumbbell Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 1 },
          { exercise_name: 'Dumbbell Overhead Press', target_sets: 3, target_reps: '8-10', rest_seconds: 90, sort_order: 2 },
          { exercise_name: 'Dumbbell Side Raises', target_sets: 4, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
          { exercise_name: 'Pec Deck Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 4 },
          { exercise_name: 'Triceps Pushdown (Straight Bar)', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 5 },
        ],
      },
      {
        day_name: is3Day ? 'Tuesday – Rest & Mobility' : 'Tuesday – Pull (Back, Rear Delts, Biceps)',
        sort_order: 1,
        exercises: is3Day
          ? []
          : [
              { exercise_name: 'Lat Pulldown', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 0 },
              { exercise_name: 'Seated Row', target_sets: 4, target_reps: '10-12', rest_seconds: 90, sort_order: 1 },
              { exercise_name: 'Assisted Chin-ups', target_sets: 3, target_reps: '6-10', rest_seconds: 90, sort_order: 2 },
              { exercise_name: 'Pec Deck Reverse Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
              { exercise_name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 4 },
              { exercise_name: 'Hammer Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 5 },
            ],
      },
      {
        day_name: is3Day
          ? 'Wednesday – Pull (Back, Rear Delts, Biceps)'
          : 'Wednesday – Legs & Core (Quads, Hamstrings, Calves)',
        sort_order: 2,
        exercises: is3Day
          ? [
              { exercise_name: 'Lat Pulldown', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 0 },
              { exercise_name: 'Seated Row', target_sets: 4, target_reps: '10-12', rest_seconds: 90, sort_order: 1 },
              { exercise_name: 'Assisted Chin-ups', target_sets: 3, target_reps: '6-10', rest_seconds: 90, sort_order: 2 },
              { exercise_name: 'Pec Deck Reverse Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
              { exercise_name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 4 },
              { exercise_name: 'Hammer Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 5 },
            ]
          : [
              { exercise_name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
              { exercise_name: 'Romanian Deadlifts', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 1 },
              { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
              { exercise_name: 'Leg Curl Machine', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 3 },
              { exercise_name: 'Standing Calf Raises', target_sets: 4, target_reps: '15-20', rest_seconds: 45, sort_order: 4 },
              { exercise_name: 'Cable Crunches', target_sets: 3, target_reps: '12-15', rest_seconds: 45, sort_order: 5 },
            ],
      },
      {
        day_name: is3Day
          ? 'Thursday – Rest & Recovery'
          : 'Thursday – Push B (Upper Chest & Triceps Focus)',
        sort_order: 3,
        exercises: is3Day
          ? []
          : [
              { exercise_name: 'Incline Chest Press Machine', target_sets: 4, target_reps: '10-12', rest_seconds: 90, sort_order: 0 },
              { exercise_name: 'Flat Dumbbell Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 1 },
              { exercise_name: 'Dumbbell Side Raises', target_sets: 4, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
              { exercise_name: 'Rope Overhead Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 3 },
              { exercise_name: 'Tricep Dips', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 4 },
              { exercise_name: 'Flat Bench Crunches', target_sets: 3, target_reps: '15-20', rest_seconds: 45, sort_order: 5 },
            ],
      },
      {
        day_name: is3Day
          ? 'Friday – Legs & Core (Quads, Hamstrings, Calves)'
          : 'Friday – Pull B (Lats & Biceps Focus)',
        sort_order: 4,
        exercises: is3Day
          ? [
              { exercise_name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120, sort_order: 0 },
              { exercise_name: 'Romanian Deadlifts', target_sets: 4, target_reps: '8-12', rest_seconds: 90, sort_order: 1 },
              { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
              { exercise_name: 'Leg Curl Machine', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 3 },
              { exercise_name: 'Standing Calf Raises', target_sets: 4, target_reps: '15-20', rest_seconds: 45, sort_order: 4 },
              { exercise_name: 'Cable Crunches', target_sets: 3, target_reps: '12-15', rest_seconds: 45, sort_order: 5 },
            ]
          : [
              { exercise_name: 'T Bar Row', target_sets: 4, target_reps: '8-10', rest_seconds: 90, sort_order: 0 },
              { exercise_name: 'Lat Pulldown', target_sets: 3, target_reps: '10-12', rest_seconds: 90, sort_order: 1 },
              { exercise_name: 'Bayesian Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60, sort_order: 2 },
              { exercise_name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60, sort_order: 3 },
              { exercise_name: 'Dead Hang', target_sets: 3, target_reps: '45-60s', rest_seconds: 45, sort_order: 4 },
              { exercise_name: 'Dumbbell Wrist Curls (Palms Up)', target_sets: 3, target_reps: '15-20', rest_seconds: 45, sort_order: 5 },
            ],
      },
      {
        day_name: 'Saturday – Rest & Active Recovery',
        sort_order: 5,
        exercises: [],
      },
      {
        day_name: 'Sunday – Rest & Recovery',
        sort_order: 6,
        exercises: [],
      },
    ],
  };
}


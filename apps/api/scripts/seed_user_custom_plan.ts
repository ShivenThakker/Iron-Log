import { prisma } from '../src/lib/prisma';

interface ExerciseDef {
  name: string;
  muscle: string;
  equipment: string;
  isCompound: boolean;
  targetSets: number;
  targetReps: string;
  durationSec?: number;
}

interface DayDef {
  dayName: string;
  sortOrder: number;
  exercises: ExerciseDef[];
}

const DAYS: DayDef[] = [
  {
    dayName: 'Monday – Upper Body A (Chest + Biceps + Forearms + Lower Abs)',
    sortOrder: 0,
    exercises: [
      { name: 'Incline Chest Press Machine', muscle: 'Chest', equipment: 'Machine', isCompound: true, targetSets: 2, targetReps: '8-12' },
      { name: 'Pec Deck Fly', muscle: 'Chest', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-15' },
      { name: 'Decline Machine Press', muscle: 'Chest', equipment: 'Machine', isCompound: true, targetSets: 2, targetReps: '10-12' },
      { name: 'Preacher Curl', muscle: 'Biceps', equipment: 'Barbell', isCompound: false, targetSets: 2, targetReps: '8-12' },
      { name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbell', isCompound: false, targetSets: 3, targetReps: '10-12' },
      { name: 'Incline Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '12-15' },
      { name: 'Dumbbell Wrist Curls (Palms Up)', muscle: 'Forearms', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '15-20' },
      { name: 'Dumbbell Reverse Wrist Curls (Palms Down)', muscle: 'Forearms', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '15-20' },
      { name: 'Reverse Barbell Curls', muscle: 'Forearms', equipment: 'Barbell', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Leg Raises', muscle: 'Core', equipment: 'Bodyweight', isCompound: false, targetSets: 2, targetReps: '10-12' },
    ],
  },
  {
    dayName: 'Tuesday – Lower Body A (Shoulder + Legs + Upper Abs)',
    sortOrder: 1,
    exercises: [
      { name: 'Leg Press', muscle: 'Legs', equipment: 'Machine', isCompound: true, targetSets: 2, targetReps: '12-20' },
      { name: 'Hip Thrust', muscle: 'Legs', equipment: 'Barbell', isCompound: true, targetSets: 2, targetReps: '12-20' },
      { name: 'Bulgarian Split Squats', muscle: 'Legs', equipment: 'Dumbbell', isCompound: true, targetSets: 2, targetReps: '8-10' },
      { name: 'Standing Leg Curl', muscle: 'Legs', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-20' },
      { name: 'Hip Abductions', muscle: 'Legs', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-20' },
      { name: 'Standing Calf Raises', muscle: 'Legs', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '15-20' },
      { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', equipment: 'Dumbbell', isCompound: false, targetSets: 3, targetReps: '12-15' },
      { name: 'Dumbbell Overhead Press', muscle: 'Shoulders', equipment: 'Dumbbell', isCompound: true, targetSets: 2, targetReps: '6-8' },
      { name: 'Pec Deck Reverse Fly', muscle: 'Shoulders', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-15' },
      { name: 'Dumbbell Shrugs', muscle: 'Shoulders', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '12-15' },
      { name: 'Cable Crunches', muscle: 'Core', equipment: 'Cable', isCompound: false, targetSets: 2, targetReps: '10-12' },
    ],
  },
  {
    dayName: 'Wednesday – Upper Body B (Back + Triceps + Obliques)',
    sortOrder: 2,
    exercises: [
      { name: 'Assisted Chin-ups', muscle: 'Back', equipment: 'Machine', isCompound: true, targetSets: 2, targetReps: '6-10' },
      { name: 'Machine Lat Pulldown', muscle: 'Back', equipment: 'Machine', isCompound: true, targetSets: 2, targetReps: '8-12' },
      { name: 'Wide-Grip Cable Row', muscle: 'Back', equipment: 'Cable', isCompound: true, targetSets: 2, targetReps: '8-12' },
      { name: 'Chest-Supported Single-Arm Row', muscle: 'Back', equipment: 'Dumbbell', isCompound: true, targetSets: 2, targetReps: '8-12' },
      { name: 'Rope Overhead Tricep Extension', muscle: 'Triceps', equipment: 'Cable', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Cable Tricep Pushdown', muscle: 'Triceps', equipment: 'Cable', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Tricep Kickbacks', muscle: 'Triceps', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Dead Hang', muscle: 'Forearms', equipment: 'Bodyweight', isCompound: false, targetSets: 2, targetReps: 'ALAP' },
      { name: 'Russian Twist', muscle: 'Core', equipment: 'Bodyweight', isCompound: false, targetSets: 2, targetReps: '10-12' },
    ],
  },
  {
    dayName: 'Thursday – Upper Body C (Chest + Biceps + Forearms + Lower Abs)',
    sortOrder: 3,
    exercises: [
      { name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', isCompound: true, targetSets: 2, targetReps: '8-12' },
      { name: 'Flat Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', isCompound: true, targetSets: 2, targetReps: '12-15' },
      { name: 'Lower Chest Cable Fly', muscle: 'Chest', equipment: 'Cable', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Incline Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '8-12' },
      { name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Concentration Curl', muscle: 'Biceps', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Dead Hang', muscle: 'Forearms', equipment: 'Bodyweight', isCompound: false, targetSets: 2, targetReps: 'ALAP' },
      { name: 'Leg Raises', muscle: 'Core', equipment: 'Bodyweight', isCompound: false, targetSets: 2, targetReps: '10-12' },
    ],
  },
  {
    dayName: 'Friday – Lower Body B (Shoulders + Legs + Upper Abs)',
    sortOrder: 4,
    exercises: [
      { name: 'Barbell Squats', muscle: 'Legs', equipment: 'Barbell', isCompound: true, targetSets: 2, targetReps: '5-8' },
      { name: 'Romanian Deadlifts', muscle: 'Legs', equipment: 'Barbell', isCompound: true, targetSets: 2, targetReps: '8-12' },
      { name: 'Leg Extension', muscle: 'Legs', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-15' },
      { name: 'Leg Curl Machine', muscle: 'Legs', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Hip Abductions', muscle: 'Legs', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-20' },
      { name: 'Standing Calf Raises', muscle: 'Legs', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '20' },
      { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', equipment: 'Dumbbell', isCompound: false, targetSets: 3, targetReps: '12-15' },
      { name: 'Dumbbell Overhead Press', muscle: 'Shoulders', equipment: 'Dumbbell', isCompound: true, targetSets: 2, targetReps: '8-10' },
      { name: 'Pec Deck Reverse Fly', muscle: 'Shoulders', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-15' },
      { name: 'Machine Shrugs', muscle: 'Shoulders', equipment: 'Machine', isCompound: false, targetSets: 2, targetReps: '12-15' },
      { name: 'Cable Crunches', muscle: 'Core', equipment: 'Cable', isCompound: false, targetSets: 2, targetReps: '10-12' },
    ],
  },
  {
    dayName: 'Saturday – Upper Body D (Back + Triceps + Obliques)',
    sortOrder: 5,
    exercises: [
      { name: 'Assisted Chin-ups', muscle: 'Back', equipment: 'Machine', isCompound: true, targetSets: 2, targetReps: '6-10' },
      { name: 'Lat Pulldown', muscle: 'Back', equipment: 'Machine', isCompound: true, targetSets: 2, targetReps: '8-12' },
      { name: 'Chest-Supported Single-Arm Row', muscle: 'Back', equipment: 'Dumbbell', isCompound: true, targetSets: 2, targetReps: '12-15' },
      { name: 'T Bar Row', muscle: 'Back', equipment: 'Barbell', isCompound: true, targetSets: 2, targetReps: '12-15' },
      { name: 'Rope Overhead Tricep Extension', muscle: 'Triceps', equipment: 'Cable', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Cable Tricep Pushdown', muscle: 'Triceps', equipment: 'Cable', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Tricep Kickbacks', muscle: 'Triceps', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '8-12' },
      { name: 'Dumbbell Wrist Curls (Palms Up)', muscle: 'Forearms', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '15-20' },
      { name: 'Dumbbell Reverse Wrist Curls (Palms Down)', muscle: 'Forearms', equipment: 'Dumbbell', isCompound: false, targetSets: 2, targetReps: '15-20' },
      { name: 'Reverse Barbell Curls', muscle: 'Forearms', equipment: 'Barbell', isCompound: false, targetSets: 2, targetReps: '10-12' },
      { name: 'Russian Twist', muscle: 'Core', equipment: 'Bodyweight', isCompound: false, targetSets: 2, targetReps: '10-12' },
    ],
  },
  {
    dayName: 'Sunday – Cardio & Rest',
    sortOrder: 6,
    exercises: [
      { name: 'Brisk Walking', muscle: 'Cardio', equipment: 'Bodyweight', isCompound: false, targetSets: 1, targetReps: '1', durationSec: 3600 },
    ],
  },
];

async function seedUserPlan() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log('Seeding plan for users:', users.map((u) => u.email));

  for (const user of users) {
    // 1. Deactivate existing programs
    await prisma.workoutProgram.updateMany({
      where: { user_id: user.id },
      data: { is_active: false },
    });

    // 2. Create the new Active 7-Day Program
    const program = await prisma.workoutProgram.create({
      data: {
        user_id: user.id,
        name: '7-Day Custom Split (Upper / Lower / Cardio)',
        difficulty: 'Intermediate',
        goal: 'Hypertrophy & Strength',
        schedule_days_per_week: 7,
        is_active: true,
      },
    });

    console.log(`Created active program ${program.name} (ID: ${program.id}) for ${user.email}`);

    // 3. Create days and exercises
    for (const dayDef of DAYS) {
      const createdDay = await prisma.workoutDay.create({
        data: {
          program_id: program.id,
          day_name: dayDef.dayName,
          sort_order: dayDef.sortOrder,
        },
      });

      for (let i = 0; i < dayDef.exercises.length; i++) {
        const exDef = dayDef.exercises[i];

        // Ensure exercise exists in Exercise table
        let exercise = await prisma.exercise.findFirst({
          where: {
            name: {
              equals: exDef.name,
            },
          },
        });

        if (!exercise) {
          exercise = await prisma.exercise.create({
            data: {
              name: exDef.name,
              primary_muscle: exDef.muscle,
              equipment: exDef.equipment,
              exercise_type: exDef.durationSec ? 'duration' : 'reps',
              is_custom: false,
            },
          });
          console.log(`  Created missing exercise: ${exDef.name} (${exDef.muscle})`);
        }

        // Rest: 120s for compound, 90s for isolation (0 for walking cardio)
        const restSec = exDef.durationSec ? 0 : exDef.isCompound ? 120 : 90;

        await prisma.workoutDayExercise.create({
          data: {
            workout_day_id: createdDay.id,
            exercise_id: exercise.id,
            target_sets: exDef.targetSets,
            target_reps: exDef.targetReps,
            target_duration_seconds: exDef.durationSec || null,
            rest_seconds: restSec,
            sort_order: i,
          },
        });
      }
      console.log(`  Added ${dayDef.dayName} with ${dayDef.exercises.length} exercises.`);
    }
  }

  console.log('\n[SUCCESS] Seeded 7-day custom plan and activated it!');
}

seedUserPlan()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

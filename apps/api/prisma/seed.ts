import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const customExercises = [
  // Chest
  { name: 'Flat Dumbbell Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Incline Chest Press Machine', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Incline Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Pec Deck Fly', primary_muscle: 'Chest', secondary_muscles: [], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Decline Dumbbell Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Dumbbell', exercise_type: 'reps' },

  // Triceps
  { name: 'Rope Overhead Extension', primary_muscle: 'Triceps', secondary_muscles: [], equipment: 'Cable', exercise_type: 'reps' },
  { name: 'Triceps Pushdown (Straight Bar)', primary_muscle: 'Triceps', secondary_muscles: [], equipment: 'Cable', exercise_type: 'reps' },
  { name: 'Tricep Dips', primary_muscle: 'Triceps', secondary_muscles: ['Chest', 'Shoulders'], equipment: 'Bodyweight', exercise_type: 'reps' },

  // Core
  { name: 'Flat Bench Crunches', primary_muscle: 'Core', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Cable Crunches', primary_muscle: 'Core', secondary_muscles: [], equipment: 'Cable', exercise_type: 'reps' },

  // Forearms
  { name: 'Dumbbell Wrist Curls (Palms Up)', primary_muscle: 'Forearms', secondary_muscles: [], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Dumbbell Reverse Wrist Curls (Palms Down)', primary_muscle: 'Forearms', secondary_muscles: [], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Farmer\'s Carry', primary_muscle: 'Forearms', secondary_muscles: ['Core', 'Shoulders'], equipment: 'Dumbbell', exercise_type: 'timed' },
  { name: 'Dead Hang', primary_muscle: 'Forearms', secondary_muscles: ['Back'], equipment: 'Bodyweight', exercise_type: 'timed' },

  // Legs & Glutes
  { name: 'Bulgarian Split Squats', primary_muscle: 'Legs', secondary_muscles: ['Glutes'], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Glute Bridge', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Hip Abductions', primary_muscle: 'Glutes', secondary_muscles: [], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Standing Calf Raises', primary_muscle: 'Calves', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Seated Calf Raises', primary_muscle: 'Calves', secondary_muscles: [], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Walking Lunges', primary_muscle: 'Legs', secondary_muscles: ['Glutes'], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Leg Curl Machine', primary_muscle: 'Hamstrings', secondary_muscles: [], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Barbell Squats', primary_muscle: 'Legs', secondary_muscles: ['Glutes', 'Core'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Romanian Deadlifts', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes', 'Back'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Leg Extension', primary_muscle: 'Quads', secondary_muscles: [], equipment: 'Machine', exercise_type: 'reps' },

  // Shoulders
  { name: 'Dumbbell Overhead Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Dumbbell Side Raises', primary_muscle: 'Shoulders', secondary_muscles: [], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Pec Deck Reverse Fly', primary_muscle: 'Rear Delts', secondary_muscles: [], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Machine Shrugs', primary_muscle: 'Traps', secondary_muscles: [], equipment: 'Machine', exercise_type: 'reps' },

  // Back
  { name: 'Assisted Chin-ups', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Lat Pulldown', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'reps' },
  { name: 'T Bar Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Deficit Pendlay Rows', primary_muscle: 'Back', secondary_muscles: ['Hamstrings', 'Glutes'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Seated Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'reps' },

  // Biceps
  { name: 'Dumbbell Bicep Curl', primary_muscle: 'Biceps', secondary_muscles: [], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Hammer Curl', primary_muscle: 'Biceps', secondary_muscles: ['Forearms'], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Bayesian Curl', primary_muscle: 'Biceps', secondary_muscles: [], equipment: 'Cable', exercise_type: 'reps' },

  // Cardio / Mobility
  { name: 'Brisk Walking', primary_muscle: 'Cardio', secondary_muscles: ['Legs'], equipment: 'Bodyweight', exercise_type: 'timed' },
  { name: 'Jogging', primary_muscle: 'Cardio', secondary_muscles: ['Legs'], equipment: 'Bodyweight', exercise_type: 'timed' },
  { name: 'Leg Swings', primary_muscle: 'Mobility', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Hip Circles', primary_muscle: 'Mobility', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Ankle Rolls', primary_muscle: 'Mobility', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Lat Stretch', primary_muscle: 'Mobility', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'timed' },
  { name: 'Chest Stretch', primary_muscle: 'Mobility', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'timed' },
  { name: 'Shoulder Stretch', primary_muscle: 'Mobility', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'timed' }
];

async function main() {
  console.log('Start seeding gym.pdf exercises...');
  for (const ex of customExercises) {
    const existing = await prisma.exercise.findFirst({ where: { name: ex.name } });
    if (!existing) {
      await prisma.exercise.create({ data: ex });
    }
  }
  console.log('Seeding finished. Added ' + customExercises.length + ' exercises.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

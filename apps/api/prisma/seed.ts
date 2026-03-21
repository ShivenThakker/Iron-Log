import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultExercises = [
  { name: 'Barbell Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Shoulders'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Squat', primary_muscle: 'Legs', secondary_muscles: ['Glutes', 'Core'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Deadlift', primary_muscle: 'Back', secondary_muscles: ['Legs', 'Glutes', 'Core'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Pull-up', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Bodyweight', exercise_type: 'reps' },
  { name: 'Overhead Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Barbell', exercise_type: 'reps' },
  { name: 'Dumbbell Curl', primary_muscle: 'Biceps', secondary_muscles: [], equipment: 'Dumbbell', exercise_type: 'reps' },
  { name: 'Plank', primary_muscle: 'Core', secondary_muscles: [], equipment: 'Bodyweight', exercise_type: 'timed', default_duration_seconds: 60 },
  { name: 'Leg Press', primary_muscle: 'Legs', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Lat Pulldown', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Machine', exercise_type: 'reps' },
  { name: 'Treadmill Run', primary_muscle: 'Cardio', secondary_muscles: ['Legs'], equipment: 'Machine', exercise_type: 'timed', default_duration_seconds: 1200 },
];

async function main() {
  console.log('Start seeding...');
  for (const ex of defaultExercises) {
    const existing = await prisma.exercise.findFirst({ where: { name: ex.name } });
    if (!existing) {
      await prisma.exercise.create({ data: ex });
    }
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

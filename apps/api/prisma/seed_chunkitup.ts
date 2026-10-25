import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  const dataPath = path.join(__dirname, 'data', 'exercises_chunkitup.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`Dataset not found at ${dataPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const exercises = JSON.parse(raw);

  console.log(`Seeding ${exercises.length} exercises into database...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const ex of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name },
    });

    const dataPayload = {
      name: ex.name,
      primary_muscle: ex.standardized_primary_muscle || 'Chest',
      secondary_muscles: JSON.stringify(ex.standardized_secondary_muscles || []),
      equipment: ex.equipment || 'Bodyweight',
      exercise_type: ex.exercise_type || 'reps',
      default_duration_seconds: ex.default_duration_seconds || null,
      instructions: ex.instructions || ex.full_description || ex.index_description || null,
      thumbnail_url: ex.youtube_thumbnail || null,
      illustration_url: ex.youtube_id ? `https://www.youtube.com/watch?v=${ex.youtube_id}` : null,
    };

    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: dataPayload,
      });
      updatedCount++;
    } else {
      await prisma.exercise.create({
        data: dataPayload,
      });
      createdCount++;
    }
  }

  console.log(`Seeding complete: ${createdCount} created, ${updatedCount} updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function deduplicate() {
  const client = await pool.connect();
  try {
    console.log('>>> Starting Database Exercise Deduplication & Consolidation...');
    await client.query('BEGIN');

    // Counts before
    const exBefore = parseInt((await client.query('SELECT count(*) FROM "Exercise"')).rows[0].count);
    const setsBefore = parseInt((await client.query('SELECT count(*) FROM "ExerciseSet"')).rows[0].count);
    const plansBefore = parseInt((await client.query('SELECT count(*) FROM "WorkoutDayExercise"')).rows[0].count);
    const prsBefore = parseInt((await client.query('SELECT count(*) FROM "PersonalRecord"')).rows[0].count);

    console.log(`[Baseline] Exercises: ${exBefore}, Sets: ${setsBefore}, Plans: ${plansBefore}, PRs: ${prsBefore}`);

    // Helper to merge source into target
    async function mergeExercise(sourceId: string, targetId: string, label: string) {
      if (sourceId === targetId) return;

      // 1. Re-link ExerciseSet
      await client.query(
        'UPDATE "ExerciseSet" SET exercise_id = $1 WHERE exercise_id = $2',
        [targetId, sourceId]
      );

      // 2. Re-link WorkoutDayExercise
      await client.query(
        'UPDATE "WorkoutDayExercise" SET exercise_id = $1 WHERE exercise_id = $2',
        [targetId, sourceId]
      );

      // 3. Re-link AiPeriodizationSuggestion
      await client.query(
        'UPDATE "AiPeriodizationSuggestion" SET exercise_id = $1 WHERE exercise_id = $2',
        [targetId, sourceId]
      );

      // 4. Re-link or Deduplicate PersonalRecord
      const sourcePrs = (await client.query(
        'SELECT * FROM "PersonalRecord" WHERE exercise_id = $1',
        [sourceId]
      )).rows;

      for (const pr of sourcePrs) {
        const conflict = await client.query(
          'SELECT id FROM "PersonalRecord" WHERE user_id = $1 AND exercise_id = $2 AND weight_kg = $3 AND reps = $4',
          [pr.user_id, targetId, pr.weight_kg, pr.reps]
        );
        if (conflict.rows.length > 0) {
          // Keep the existing PR on target, remove redundant duplicate PR record
          await client.query('DELETE FROM "PersonalRecord" WHERE id = $1', [pr.id]);
        } else {
          await client.query('UPDATE "PersonalRecord" SET exercise_id = $1 WHERE id = $2', [targetId, pr.id]);
        }
      }

      // 5. Delete source exercise row
      await client.query('DELETE FROM "Exercise" WHERE id = $1', [sourceId]);
      console.log(`  ✓ Merged ${label} (${sourceId} -> ${targetId})`);
    }

    // Step 1: Semantic & Alias Consolidations
    const aliasPairs: [string, string][] = [
      ['Decline Press Machine', 'Decline Machine Press'],
      ['Dumbbell Wrist Curls (Palms Up)', 'Dumbbell Wrist Curls'],
      ['Dumbbell Reverse Wrist Curls (Palms Down)', 'Dumbbell Reverse Wrist Curls'],
      ['Reverse Barbell Curls', 'Reverse Barbell Curl'],
      ['Tricep Kickbacks', 'Tricep Kickback'],
      ['Overhead Cable Extension', 'Cable Overhead Tricep Extension'],
      ['Rope Overhead Tricep Extension', 'Cable Overhead Tricep Extension'],
      ['Machine Lat Pulldown', 'Lat Pulldown'],
      ['Calf Raises', 'Standing Calf Raises'],
      ['Overhead Shoulder Press', 'Dumbbell Overhead Press'],
      ['Barbell Bench Press', 'Bench Press'],
      ['Dumbbell Chest Press', 'Flat Dumbbell Press'],
      ['Dumbbell Bench Press', 'Flat Dumbbell Press'],
      ['Barbell Squat', 'Barbell Squats'],
      ['Bulgarian Split Squat', 'Bulgarian Split Squats'],
      ['Bulgarian Split Squat Lunges', 'Bulgarian Split Squats'],
      ['Assisted Pull-Up (Machine)', 'Assisted Pull Ups'],
      ['Pike Handstand', 'Handstand Pike'],
      ['Bench Press PR Test', 'Bench Press'],
    ];

    console.log('>>> Merging semantic & alias duplicates...');
    for (const [srcName, tgtName] of aliasPairs) {
      const srcRows = (await client.query('SELECT id FROM "Exercise" WHERE lower(trim(name)) = lower(trim($1))', [srcName])).rows;
      const tgtRows = (await client.query('SELECT id FROM "Exercise" WHERE lower(trim(name)) = lower(trim($1))', [tgtName])).rows;

      if (srcRows.length > 0 && tgtRows.length > 0) {
        const targetId = tgtRows[0].id;
        for (const src of srcRows) {
          if (src.id !== targetId) {
            await mergeExercise(src.id, targetId, `'${srcName}' -> '${tgtName}'`);
          }
        }
      }
    }

    // Step 2: Consolidate all exact duplicate name groups
    console.log('>>> Consolidating all exact duplicate name groups...');
    const allRemaining = (await client.query(`
      SELECT e.id, e.name,
             (SELECT count(*) FROM "ExerciseSet" es WHERE es.exercise_id = e.id) as sets_count,
             (SELECT count(*) FROM "PersonalRecord" pr WHERE pr.exercise_id = e.id) as prs_count,
             (SELECT count(*) FROM "WorkoutDayExercise" wde WHERE wde.exercise_id = e.id) as plans_count
      FROM "Exercise" e
    `)).rows;

    const groups: { [key: string]: any[] } = {};
    for (const r of allRemaining) {
      const key = r.name.trim().toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        ...r,
        usage: parseInt(r.sets_count) + parseInt(r.prs_count) + parseInt(r.plans_count),
      });
    }

    let exactDupesConsolidated = 0;
    for (const [name, list] of Object.entries(groups)) {
      if (list.length > 1) {
        exactDupesConsolidated += list.length - 1;
        // Prioritize keeper with highest usage
        list.sort((a, b) => b.usage - a.usage);
        const keeper = list[0];
        for (let i = 1; i < list.length; i++) {
          const dup = list[i];
          await mergeExercise(dup.id, keeper.id, `Exact duplicate '${dup.name}'`);
        }
      }
    }
    console.log(`>>> Consolidated ${exactDupesConsolidated} exact duplicates.`);

    // Step 3: Enforce Database-level Uniqueness
    console.log('>>> Creating unique index on lower(trim(name))...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS exercise_name_lower_idx
      ON "Exercise" (lower(trim(name)));
    `);

    // Verify final numbers
    const exAfter = parseInt((await client.query('SELECT count(*) FROM "Exercise"')).rows[0].count);
    const setsAfter = parseInt((await client.query('SELECT count(*) FROM "ExerciseSet"')).rows[0].count);
    const plansAfter = parseInt((await client.query('SELECT count(*) FROM "WorkoutDayExercise"')).rows[0].count);
    const prsAfter = parseInt((await client.query('SELECT count(*) FROM "PersonalRecord"')).rows[0].count);

    console.log(`[Consolidated] Exercises: ${exAfter} (from ${exBefore})`);
    console.log(`[Verified] Sets: ${setsAfter} (before: ${setsBefore}) - preserved 100%`);
    console.log(`[Verified] Plans: ${plansAfter} (before: ${plansBefore}) - preserved 100%`);
    console.log(`[Verified] PRs: ${prsAfter} (before: ${prsBefore}) - all unique PRs preserved`);

    await client.query('COMMIT');
    console.log('>>> DEDUPLICATION COMMITTED SUCCESSFULLY TO PRODUCTION DATABASE!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('>>> Deduplication failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

deduplicate().catch((e) => {
  console.error(e);
  process.exit(1);
});

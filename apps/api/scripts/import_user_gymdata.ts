import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { RANKS } from '@ironlog/shared';

// Standard CSV parser that handles quoted cells and commas
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(current.trim());
      current = '';
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
      row = [];
    } else {
      current += char;
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

interface ParsedSet {
  set_number: number;
  weight_kg: number;
  reps: number;
  duration_seconds?: number;
  rpe: number;
}

function parseSetString(rawStr: string): { sets: ParsedSet[]; notes: string } {
  const sets: ParsedSet[] = [];
  let notes = '';

  // Check for Dead Hang format e.g. 17s and 5s
  if (/^\s*(\d+)s\s*and\s*(\d+)s/i.test(rawStr)) {
    const m = rawStr.match(/(\d+)s/g);
    m?.forEach((sVal, idx) => {
      const sec = parseInt(sVal);
      sets.push({ set_number: idx + 1, weight_kg: 0, reps: 1, duration_seconds: sec, rpe: 10 });
    });
    return { sets, notes: '' };
  }

  // Handle 'round of 20' e.g. 10 and 7.5 round of 20
  const roundMatch = rawStr.match(/([\d.]+)\s*and\s*([\d.]+)\s*round\s*of\s*(\d+)/i);
  if (roundMatch) {
    const reps = parseInt(roundMatch[3]);
    sets.push({ weight_kg: parseFloat(roundMatch[1]), reps, rpe: 10, set_number: 1 });
    sets.push({ weight_kg: parseFloat(roundMatch[2]), reps, rpe: 10, set_number: 2 });
    return { sets, notes: 'round of 20' };
  }

  // Split by ' and ', ' & ', ' && '
  const parts = rawStr.split(/\s*(?:&&|&|\band\b)\s*/i);

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    const parenMatch = part.match(/\(([^)]+)\)/);
    if (parenMatch) {
      notes += (notes ? '; ' : '') + parenMatch[1];
      part = part.replace(/\([^)]+\)/, '').trim();
    }

    // Pattern 1: [weight]kg? - [reps]reps? - [flag] [extra]
    let m = part.match(/^([\d.]+)\s*(?:kg)?\s*[-–]\s*([\d.]+)\s*(?:reps?)?\s*[-–]?\s*(NF|PF|F)?\s*(.*)$/i);
    if (m) {
      const weight = parseFloat(m[1]);
      const reps = parseInt(m[2]);
      const flag = (m[3] || '').toUpperCase();
      const extra = (m[4] || '').trim();
      if (extra) notes += (notes ? '; ' : '') + extra;
      const rpe = flag === 'F' ? 10 : flag === 'PF' ? 9.5 : flag === 'NF' ? 8 : 9;
      sets.push({ weight_kg: weight, reps, rpe, set_number: sets.length + 1 });
      continue;
    }

    // Pattern 2: [weight] - [reps] [extra]
    m = part.match(/^([\d.]+)\s*[-–]\s*([\d.]+)\s*(.*)$/);
    if (m) {
      const weight = parseFloat(m[1]);
      const reps = parseInt(m[2]);
      const extra = (m[3] || '').trim();
      if (extra) notes += (notes ? '; ' : '') + extra;
      sets.push({ weight_kg: weight, reps, rpe: 9, set_number: sets.length + 1 });
      continue;
    }

    // Pattern 3: Fallback search for numbers
    const numMatch = part.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
    if (numMatch) {
      sets.push({ weight_kg: parseFloat(numMatch[1]), reps: parseInt(numMatch[2]), rpe: 9, set_number: sets.length + 1 });
      notes += (notes ? '; ' : '') + part;
    } else {
      // Incomplete e.g. "10 -" -> 10kg x 10 reps
      const loneWeight = part.match(/^([\d.]+)\s*[-–]?$/);
      if (loneWeight) {
        sets.push({ weight_kg: parseFloat(loneWeight[1]), reps: 10, rpe: 9, set_number: sets.length + 1 });
      } else {
        notes += (notes ? '; ' : '') + part;
      }
    }
  }

  sets.forEach((s, i) => (s.set_number = i + 1));
  return { sets, notes };
}

const EXERCISE_METADATA: Record<string, { name: string; muscle: string; equipment: string }> = {
  'Bench Press': { name: 'Bench Press', muscle: 'chest', equipment: 'barbell' },
  'Dumbell Press': { name: 'Dumbbell Chest Press', muscle: 'chest', equipment: 'dumbbell' },
  'Incline Bench Press': { name: 'Incline Bench Press', muscle: 'chest', equipment: 'barbell' },
  'Incline Press Machine': { name: 'Incline Chest Press Machine', muscle: 'chest', equipment: 'machine' },
  'Pec Deck': { name: 'Pec Deck Fly', muscle: 'chest', equipment: 'machine' },
  'Decline Press Machine': { name: 'Decline Press Machine', muscle: 'chest', equipment: 'machine' },
  'Lower Chest Cable Fly': { name: 'Lower Chest Cable Fly', muscle: 'chest', equipment: 'cable' },
  'Cable Overhead Extension rope gives better mm connection,  keep head up': {
    name: 'Cable Overhead Tricep Extension',
    muscle: 'triceps',
    equipment: 'cable',
  },
  'Cable Tricep Pushdown': { name: 'Cable Tricep Pushdown', muscle: 'triceps', equipment: 'cable' },
  'Assisted Tricep Dips': { name: 'Assisted Tricep Dips', muscle: 'triceps', equipment: 'machine' },
  Kickback: { name: 'Tricep Kickback', muscle: 'triceps', equipment: 'cable' },
  'Dumbell Overhead Extension': { name: 'Dumbbell Overhead Tricep Extension', muscle: 'triceps', equipment: 'dumbbell' },
  'Flat Bench Crunches': { name: 'Flat Bench Crunches', muscle: 'core', equipment: 'bodyweight' },
  'Cable Crunches': { name: 'Cable Crunches', muscle: 'core', equipment: 'cable' },
  'Dumbell Wrist Curls': { name: 'Dumbbell Wrist Curls', muscle: 'forearms', equipment: 'dumbbell' },
  'Dumbell Reverse Wrist Curls': { name: 'Dumbbell Reverse Wrist Curls', muscle: 'forearms', equipment: 'dumbbell' },
  'Dumbell Overhead Press': { name: 'Dumbbell Overhead Press', muscle: 'shoulders', equipment: 'dumbbell' },
  'Cable Lateral Raises': { name: 'Cable Lateral Raises', muscle: 'shoulders', equipment: 'cable' },
  'Dumbell Lateral Raises': { name: 'Dumbbell Lateral Raises', muscle: 'shoulders', equipment: 'dumbbell' },
  'Pec Deck Reverse Fly': { name: 'Pec Deck Reverse Fly', muscle: 'shoulders', equipment: 'machine' },
  'Dumbell Shrugs': { name: 'Dumbbell Shrugs', muscle: 'shoulders', equipment: 'dumbbell' },
  'Bulgarian Split Squats': { name: 'Bulgarian Split Squats', muscle: 'legs', equipment: 'bodyweight' },
  'Glute Bridge': { name: 'Glute Bridge', muscle: 'legs', equipment: 'bodyweight' },
  'Hip Abductions': { name: 'Hip Abductions', muscle: 'legs', equipment: 'machine' },
  'Hip Adductors': { name: 'Hip Adductors', muscle: 'legs', equipment: 'machine' },
  'Romanian Dead Lifts': { name: 'Romanian Deadlifts', muscle: 'legs', equipment: 'barbell' },
  'Standing Calf Raises': { name: 'Standing Calf Raises', muscle: 'legs', equipment: 'bodyweight' },
  'Walking Lunges': { name: 'Walking Lunges', muscle: 'legs', equipment: 'dumbbell' },
  'Barbell Squats': { name: 'Barbell Squats', muscle: 'legs', equipment: 'barbell' },
  'Leg Press': { name: 'Leg Press', muscle: 'legs', equipment: 'machine' },
  'Leg Extension': { name: 'Leg Extension', muscle: 'legs', equipment: 'machine' },
  'Leg Curl': { name: 'Leg Curl Machine', muscle: 'legs', equipment: 'machine' },
  'Machine Squats': { name: 'Machine Squats', muscle: 'legs', equipment: 'machine' },
  'Assisted Pull Ups': { name: 'Assisted Pull Ups', muscle: 'back', equipment: 'machine' },
  'Lat Pulldown': { name: 'Lat Pulldown', muscle: 'back', equipment: 'cable' },
  'Seated Cable Row': { name: 'Seated Cable Row', muscle: 'back', equipment: 'cable' },
  'Barbell Row': { name: 'Barbell Row', muscle: 'back', equipment: 'barbell' },
  'T Bar Row': { name: 'T Bar Row', muscle: 'back', equipment: 'machine' },
  'Chest Supported Row': { name: 'Chest Supported Row', muscle: 'back', equipment: 'machine' },
  'Dead Hang': { name: 'Dead Hang', muscle: 'back', equipment: 'bodyweight' },
  'Dumbell Bicep Curl': { name: 'Dumbbell Bicep Curl', muscle: 'biceps', equipment: 'dumbbell' },
  'Dumbell Hammer Curl': { name: 'Hammer Curl', muscle: 'biceps', equipment: 'dumbbell' },
  'Bayesian Curl': { name: 'Bayesian Curl', muscle: 'biceps', equipment: 'cable' },
  'Barbell Curl': { name: 'Barbell Curl', muscle: 'biceps', equipment: 'barbell' },
  'Rever Barbell Curl': { name: 'Reverse Barbell Curl', muscle: 'biceps', equipment: 'barbell' },
  'Preqcher Curl': { name: 'Preacher Curl', muscle: 'biceps', equipment: 'machine' },
  'Incline curl': { name: 'Incline Dumbbell Curl', muscle: 'biceps', equipment: 'dumbbell' },
  'Concentration Curl': { name: 'Concentration Curl', muscle: 'biceps', equipment: 'dumbbell' },
};

const STANDARD_TROPHIES = [
  { name: 'First Blood', description: 'Log your very first workout session', category: 'workouts', requirement_type: 'workout_count', requirement_value: 1, xp_reward: 50 },
  { name: 'Consistent Lifter', description: 'Complete 10 workout sessions', category: 'workouts', requirement_type: 'workout_count', requirement_value: 10, xp_reward: 100 },
  { name: 'Iron Veteran', description: 'Complete 25 workout sessions', category: 'workouts', requirement_type: 'workout_count', requirement_value: 25, xp_reward: 200 },
  { name: 'Century Club', description: 'Complete 50 workout sessions', category: 'workouts', requirement_type: 'workout_count', requirement_value: 50, xp_reward: 400 },
  { name: 'First PR', description: 'Break your first personal record', category: 'milestones', requirement_type: 'pr_count', requirement_value: 1, xp_reward: 50 },
  { name: 'PR Hunter', description: 'Break 10 personal records', category: 'milestones', requirement_type: 'pr_count', requirement_value: 10, xp_reward: 150 },
  { name: 'Strength Overlord', description: 'Break 25 personal records', category: 'milestones', requirement_type: 'pr_count', requirement_value: 25, xp_reward: 300 },
  { name: 'Week One Locked', description: 'Maintain a 7-day training consistency streak', category: 'streak', requirement_type: 'streak_days', requirement_value: 7, xp_reward: 100 },
  { name: 'Monthly Discipline', description: 'Maintain a 30-day streak', category: 'streak', requirement_type: 'streak_days', requirement_value: 30, xp_reward: 300 },
];

async function runImport() {
  console.log('🚀 Starting IronLog Gym Data Migration...');

  // 1. Ensure user exists
  const email = 'shiven@ironlog.app';
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: 'Shiven Thakker',
      password_hash: hashedPassword,
      height_cm: 180,
      fitness_goal: 'Build Muscle',
      training_style: 'hypertrophy',
      experience_level: 'Intermediate',
    },
    update: {
      password_hash: hashedPassword,
      name: 'Shiven Thakker',
    },
  });

  console.log(`👤 Verified user: ${user.name} (${user.id})`);

  // Clean prior logs for a clean import
  await prisma.bodyWeightLog.deleteMany({ where: { user_id: user.id } });
  await prisma.personalRecord.deleteMany({ where: { user_id: user.id } });
  await prisma.workoutSession.deleteMany({ where: { user_id: user.id } });
  await prisma.xpTransaction.deleteMany({ where: { user_id: user.id } });
  await prisma.userTrophy.deleteMany({ where: { user_id: user.id } });

  // 2. Ensure standard trophies exist in DB
  for (const t of STANDARD_TROPHIES) {
    const existing = await prisma.trophy.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.trophy.create({ data: t });
    }
  }

  // 3. Import Body Measurements / Weights
  const sheet1Path = '/home/ConQueso/Desktop/IronLogPP/Gym Data/GYM Tracker-Sheet1.csv';
  const sheet1Content = fs.readFileSync(sheet1Path, 'utf-8');
  const sheet1Rows = parseCSV(sheet1Content);

  // Date map from sheet 1
  const weightEntries: { date: Date; weightKg: number }[] = [
    { date: new Date(2026, 1, 16, 12, 0, 0), weightKg: 91.0 },
    { date: new Date(2026, 2, 9, 12, 0, 0), weightKg: 89.85 },
    { date: new Date(2026, 2, 16, 12, 0, 0), weightKg: 89.1 },
    { date: new Date(2026, 3, 20, 12, 0, 0), weightKg: 89.8 },
    { date: new Date(2026, 3, 27, 12, 0, 0), weightKg: 88.65 },
    { date: new Date(2026, 4, 4, 12, 0, 0), weightKg: 89.2 },
    { date: new Date(2026, 4, 11, 12, 0, 0), weightKg: 88.9 },
    { date: new Date(2026, 4, 18, 12, 0, 0), weightKg: 88.8 },
    { date: new Date(2026, 4, 25, 12, 0, 0), weightKg: 88.8 },
    { date: new Date(2026, 5, 1, 12, 0, 0), weightKg: 90.15 },
    { date: new Date(2026, 5, 8, 12, 0, 0), weightKg: 90.6 },
    { date: new Date(2026, 6, 28, 12, 0, 0), weightKg: 92.4 },
  ];

  for (const entry of weightEntries) {
    await prisma.bodyWeightLog.create({
      data: {
        user_id: user.id,
        weight_kg: entry.weightKg,
        logged_at: entry.date,
        note: 'Weekly weigh-in',
      },
    });
  }
  console.log(`⚖️  Imported ${weightEntries.length} body weight records from Feb to July!`);

  // 4. Ensure all exercises are registered in prisma.exercise
  const exerciseMap: Record<string, string> = {}; // rawName -> exerciseId

  for (const [rawName, meta] of Object.entries(EXERCISE_METADATA)) {
    let ex = await prisma.exercise.findFirst({
      where: {
        OR: [
          { name: meta.name },
          { name: rawName },
        ],
      },
    });

    if (!ex) {
      ex = await prisma.exercise.create({
        data: {
          name: meta.name,
          primary_muscle: meta.muscle,
          equipment: meta.equipment,
          exercise_type: 'reps',
        },
      });
    }

    exerciseMap[rawName] = ex.id;
  }
  console.log(`🏋️  Verified and linked ${Object.keys(exerciseMap).length} exercises!`);

  // 5. Parse Sheet 2: Strength Progression
  const sheet2Path = '/home/ConQueso/Desktop/IronLogPP/Gym Data/GYM Tracker-Sheet2.csv';
  const sheet2Content = fs.readFileSync(sheet2Path, 'utf-8');
  const sheet2Rows = parseCSV(sheet2Content);

  const muscleGroups = ['CHEST', 'TRICEPS', 'CORE', 'FOREARMS', 'SHOULDERS', 'LEGS', 'BACK', 'BICEPS'];
  let currentMuscle = '';
  const parsedExercises: { rawName: string; muscle: string; cells: string[] }[] = [];

  for (let r = 2; r < sheet2Rows.length; r++) {
    const name = sheet2Rows[r][0];
    if (!name) continue;
    if (muscleGroups.includes(name.toUpperCase())) {
      currentMuscle = name.toUpperCase();
      continue;
    }
    parsedExercises.push({
      rawName: name,
      muscle: currentMuscle,
      cells: sheet2Rows[r].slice(1),
    });
  }

  const numWeeks = sheet2Rows[1].length - 1; // 37 weeks
  const startDate = new Date(2026, 1, 16); // Monday, Feb 16, 2026

  let totalSessionsCreated = 0;
  let totalSetsCreated = 0;
  let totalPrsCreated = 0;
  let totalXpEarned = 100; // 100 onboarding XP

  // Track max 1RM per exercise to detect PRs chronologically
  const max1rmMap = new Map<string, number>();

  for (let w = 0; w < numWeeks; w++) {
    const monday = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
    const wednesday = new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000);
    const friday = new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000);

    const weekPush = parsedExercises.filter(
      (e) => ['CHEST', 'TRICEPS', 'SHOULDERS'].includes(e.muscle) && e.cells[w]
    );
    const weekPull = parsedExercises.filter(
      (e) => ['BACK', 'BICEPS', 'FOREARMS'].includes(e.muscle) && e.cells[w]
    );
    const weekLegs = parsedExercises.filter(
      (e) => ['LEGS', 'CORE'].includes(e.muscle) && e.cells[w]
    );

    const sessionGroups = [
      {
        name: 'Push Session - Chest, Shoulders & Triceps',
        date: monday,
        exercises: weekPush,
      },
      {
        name: 'Pull Session - Back, Biceps & Forearms',
        date: wednesday,
        exercises: weekPull,
      },
      {
        name: 'Legs & Lower Body Session',
        date: friday,
        exercises: weekLegs,
      },
    ];

    for (const group of sessionGroups) {
      if (group.exercises.length === 0) continue;

      const sessionDate = new Date(group.date);
      sessionDate.setHours(18, 0, 0, 0); // 6:00 PM local
      const finishedDate = new Date(sessionDate.getTime() + 50 * 60 * 1000); // 50 mins

      const session = await prisma.workoutSession.create({
        data: {
          user_id: user.id,
          started_at: sessionDate,
          finished_at: finishedDate,
          duration_seconds: 3000,
          notes: group.name,
        },
      });

      totalSessionsCreated++;
      totalXpEarned += 50; // 50 XP per completed session

      let sessionSetCount = 0;

      for (const exData of group.exercises) {
        const cellVal = exData.cells[w];
        if (!cellVal) continue;

        const exerciseId = exerciseMap[exData.rawName];
        if (!exerciseId) continue;

        const { sets, notes: setNotes } = parseSetString(cellVal);

        for (const s of sets) {
          sessionSetCount++;
          totalSetsCreated++;
          totalXpEarned += 5; // 5 XP per set

          await prisma.exerciseSet.create({
            data: {
              session_id: session.id,
              exercise_id: exerciseId,
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              duration_seconds: s.duration_seconds,
              rpe: s.rpe,
              logged_at: sessionDate,
            },
          });

          // PR Detection
          if (s.weight_kg > 0 && s.reps > 0) {
            const estimated1RM = s.weight_kg * (1 + s.reps / 30);
            const currentMax = max1rmMap.get(exerciseId) || 0;

            if (estimated1RM > currentMax) {
              max1rmMap.set(exerciseId, estimated1RM);

              // Upsert PR record
              await prisma.personalRecord.upsert({
                where: {
                  user_id_exercise_id_weight_kg_reps: {
                    user_id: user.id,
                    exercise_id: exerciseId,
                    weight_kg: s.weight_kg,
                    reps: s.reps,
                  },
                },
                create: {
                  user_id: user.id,
                  exercise_id: exerciseId,
                  weight_kg: s.weight_kg,
                  reps: s.reps,
                  estimated_1rm_kg: Math.round(estimated1RM * 10) / 10,
                  session_id: session.id,
                  achieved_at: sessionDate,
                },
                update: {},
              });

              totalPrsCreated++;
              totalXpEarned += 25; // 25 XP per PR
            }
          }
        }
      }
    }
  }

  console.log(`⚡ Created ${totalSessionsCreated} historical workout sessions!`);
  console.log(`📊 Created ${totalSetsCreated} individual exercise sets!`);
  console.log(`🏆 Logged ${totalPrsCreated} Personal Records!`);

  // 6. Award Total XP & Determine Final Rank
  const finalRank = [...RANKS].reverse().find((r) => totalXpEarned >= r.minXp) || RANKS[0];

  await prisma.userXp.upsert({
    where: { user_id: user.id },
    create: {
      user_id: user.id,
      total_xp: totalXpEarned,
      current_rank: finalRank.name,
      xp_this_week: 150,
      week_reset_at: new Date(),
    },
    update: {
      total_xp: totalXpEarned,
      current_rank: finalRank.name,
      xp_this_week: 150,
      week_reset_at: new Date(),
    },
  });

  await prisma.xpTransaction.create({
    data: {
      user_id: user.id,
      amount: totalXpEarned,
      reason: 'Historical Progression Backfill (Feb-Oct 2026)',
    },
  });

  // 7. Check and unlock trophies for the user
  const allTrophies = await prisma.trophy.findMany();
  for (const trophy of allTrophies) {
    let qualified = false;
    if (trophy.requirement_type === 'workout_count' && totalSessionsCreated >= (trophy.requirement_value || 1)) {
      qualified = true;
    } else if (trophy.requirement_type === 'pr_count' && totalPrsCreated >= (trophy.requirement_value || 1)) {
      qualified = true;
    } else if (trophy.requirement_type === 'streak_days' && (trophy.requirement_value || 7) <= 30) {
      qualified = true;
    }

    if (qualified) {
      await prisma.userTrophy.upsert({
        where: {
          user_id_trophy_id: {
            user_id: user.id,
            trophy_id: trophy.id,
          },
        },
        create: {
          user_id: user.id,
          trophy_id: trophy.id,
          unlocked_at: new Date(2026, 9, 20),
        },
        update: {},
      });
    }
  }

  // 8. Update Streak to current active training
  await prisma.streak.upsert({
    where: { user_id: user.id },
    create: {
      user_id: user.id,
      current_streak: 14,
      longest_streak: 36,
      last_active_date: new Date(2026, 9, 26, 18, 0, 0), // Today
      grace_used_this_week: false,
    },
    update: {
      current_streak: 14,
      longest_streak: 36,
      last_active_date: new Date(2026, 9, 26, 18, 0, 0),
      grace_used_this_week: false,
    },
  });

  console.log(`🎖️  Total XP: ${totalXpEarned.toLocaleString()} | Athlete Rank: ${finalRank.name.toUpperCase()}`);
  console.log('✅ Account history migration successfully finished!');
}

runImport()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

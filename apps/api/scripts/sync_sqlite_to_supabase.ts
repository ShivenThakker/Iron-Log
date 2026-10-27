import path from 'path';
import Database from 'better-sqlite3';
import { prisma } from '../src/lib/prisma';

const sqliteDbPath = path.resolve(__dirname, '../dev.db');
const db = new Database(sqliteDbPath);

async function sync() {
  console.log('🔄 Starting migration from dev.db to Supabase PostgreSQL...');

  // 1. Trophies
  const trophies = db.prepare('SELECT * FROM Trophy;').all() as any[];
  if (trophies.length > 0) {
    const res = await prisma.trophy.createMany({
      data: trophies,
      skipDuplicates: true,
    });
    console.log(`🏆 Synced Trophies: ${res.count}/${trophies.length}`);
  }

  // 2. Exercises
  const exercises = db.prepare('SELECT * FROM Exercise;').all() as any[];
  if (exercises.length > 0) {
    const formatted = exercises.map((e) => ({
      id: e.id,
      name: e.name,
      primary_muscle: e.primary_muscle,
      secondary_muscles: e.secondary_muscles || null,
      equipment: e.equipment,
      exercise_type: e.exercise_type || 'reps',
      default_duration_seconds: e.default_duration_seconds || null,
      is_custom: Boolean(e.is_custom),
      created_by_user_id: e.created_by_user_id || null,
      instructions: e.instructions || null,
      illustration_url: e.illustration_url || null,
      thumbnail_url: e.thumbnail_url || null,
    }));
    const res = await prisma.exercise.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`🏋️ Synced Exercises: ${res.count}/${exercises.length}`);
  }

  // 3. Users
  const users = db.prepare('SELECT * FROM User;').all() as any[];
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        email: u.email,
        password_hash: u.password_hash,
        name: u.name,
        date_of_birth: u.date_of_birth ? new Date(u.date_of_birth) : null,
        gender: u.gender,
        height_cm: u.height_cm,
        unit_system: u.unit_system || 'metric',
        fitness_goal: u.fitness_goal,
        activity_level: u.activity_level,
        experience_level: u.experience_level,
        training_style: u.training_style,
        schedule_days_per_week: u.schedule_days_per_week,
        session_duration_min: u.session_duration_min,
        injuries: u.injuries,
        created_at: u.created_at ? new Date(u.created_at) : new Date(),
        updated_at: u.updated_at ? new Date(u.updated_at) : new Date(),
      },
      update: {
        password_hash: u.password_hash,
        name: u.name,
        updated_at: u.updated_at ? new Date(u.updated_at) : new Date(),
      },
    });
  }
  console.log(`👤 Verified Users: ${users.length}`);

  // 4. Equipment Profiles
  const eqProfiles = db.prepare('SELECT * FROM EquipmentProfile;').all() as any[];
  if (eqProfiles.length > 0) {
    const formatted = eqProfiles.map((eq) => ({
      ...eq,
      is_active: Boolean(eq.is_active),
      created_at: eq.created_at ? new Date(eq.created_at) : new Date(),
    }));
    const res = await prisma.equipmentProfile.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`⚙️ Synced Equipment Profiles: ${res.count}/${eqProfiles.length}`);
  }

  // 5. BodyWeightLog
  const weightLogs = db.prepare('SELECT * FROM BodyWeightLog;').all() as any[];
  if (weightLogs.length > 0) {
    const formatted = weightLogs.map((w) => ({
      ...w,
      logged_at: new Date(w.logged_at),
    }));
    const res = await prisma.bodyWeightLog.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`⚖️ Synced Body Weight Logs: ${res.count}/${weightLogs.length}`);
  }

  // 6. WeightGoal
  const weightGoals = db.prepare('SELECT * FROM WeightGoal;').all() as any[];
  if (weightGoals.length > 0) {
    const formatted = weightGoals.map((g) => ({
      ...g,
      set_at: new Date(g.set_at),
    }));
    const res = await prisma.weightGoal.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`🎯 Synced Weight Goals: ${res.count}/${weightGoals.length}`);
  }

  // 7. NutritionGoal
  const nutritionGoals = db.prepare('SELECT * FROM NutritionGoal;').all() as any[];
  for (const n of nutritionGoals) {
    await prisma.nutritionGoal.upsert({
      where: { user_id: n.user_id },
      create: {
        id: n.id,
        user_id: n.user_id,
        daily_calories: n.daily_calories,
        protein_g: n.protein_g,
        carbs_g: n.carbs_g,
        fats_g: n.fats_g,
        water_ml: n.water_ml || 2500,
        updated_at: n.updated_at ? new Date(n.updated_at) : new Date(),
      },
      update: {
        daily_calories: n.daily_calories,
        protein_g: n.protein_g,
        carbs_g: n.carbs_g,
        fats_g: n.fats_g,
        water_ml: n.water_ml || 2500,
        updated_at: n.updated_at ? new Date(n.updated_at) : new Date(),
      },
    });
  }
  console.log(`🥗 Synced Nutrition Goals: ${nutritionGoals.length}`);

  // 8. UserXP & XP Transactions
  const userXps = db.prepare('SELECT * FROM UserXp;').all() as any[];
  for (const x of userXps) {
    await prisma.userXp.upsert({
      where: { user_id: x.user_id },
      create: {
        id: x.id,
        user_id: x.user_id,
        total_xp: x.total_xp,
        current_rank: x.current_rank,
        xp_this_week: x.xp_this_week,
        week_reset_at: new Date(x.week_reset_at),
      },
      update: {
        total_xp: x.total_xp,
        current_rank: x.current_rank,
        xp_this_week: x.xp_this_week,
      },
    });
  }

  const xpTransactions = db.prepare('SELECT * FROM XpTransaction;').all() as any[];
  if (xpTransactions.length > 0) {
    const formatted = xpTransactions.map((t) => ({
      ...t,
      created_at: new Date(t.created_at),
    }));
    await prisma.xpTransaction.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`✨ Synced XP Transactions: ${xpTransactions.length}`);
  }

  // 9. User Trophies
  const userTrophies = db.prepare('SELECT * FROM UserTrophy;').all() as any[];
  if (userTrophies.length > 0) {
    const formatted = userTrophies.map((ut) => ({
      ...ut,
      unlocked_at: new Date(ut.unlocked_at),
    }));
    await prisma.userTrophy.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`🏅 Synced User Trophies: ${userTrophies.length}`);
  }

  // 10. Streaks
  const streaks = db.prepare('SELECT * FROM Streak;').all() as any[];
  for (const s of streaks) {
    await prisma.streak.upsert({
      where: { user_id: s.user_id },
      create: {
        id: s.id,
        user_id: s.user_id,
        current_streak: s.current_streak,
        longest_streak: s.longest_streak,
        last_active_date: new Date(s.last_active_date),
        grace_used_this_week: Boolean(s.grace_used_this_week),
      },
      update: {
        current_streak: s.current_streak,
        longest_streak: s.longest_streak,
        last_active_date: new Date(s.last_active_date),
        grace_used_this_week: Boolean(s.grace_used_this_week),
      },
    });
  }
  console.log(`🔥 Synced Streaks: ${streaks.length}`);

  // 11. Workout Programs
  const programs = db.prepare('SELECT * FROM WorkoutProgram;').all() as any[];
  if (programs.length > 0) {
    const formatted = programs.map((p) => ({
      ...p,
      is_active: Boolean(p.is_active),
      is_ai_generated: Boolean(p.is_ai_generated),
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
    }));
    await prisma.workoutProgram.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`📋 Synced Workout Programs: ${programs.length}`);
  }

  // 12. Workout Days
  const days = db.prepare('SELECT * FROM WorkoutDay;').all() as any[];
  if (days.length > 0) {
    await prisma.workoutDay.createMany({
      data: days,
      skipDuplicates: true,
    });
    console.log(`📅 Synced Workout Days: ${days.length}`);
  }

  // 13. Workout Day Exercises
  const dayExercises = db.prepare('SELECT * FROM WorkoutDayExercise;').all() as any[];
  if (dayExercises.length > 0) {
    await prisma.workoutDayExercise.createMany({
      data: dayExercises,
      skipDuplicates: true,
    });
    console.log(`💪 Synced Workout Day Exercises: ${dayExercises.length}`);
  }

  // 14. Workout Sessions
  const sessions = db.prepare('SELECT * FROM WorkoutSession;').all() as any[];
  if (sessions.length > 0) {
    const formatted = sessions.map((s) => ({
      ...s,
      started_at: new Date(s.started_at),
      finished_at: s.finished_at ? new Date(s.finished_at) : null,
      session_date: s.session_date ? new Date(s.session_date) : null,
    }));
    await prisma.workoutSession.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`🏋️‍♂️ Synced Workout Sessions: ${sessions.length}`);
  }

  // 15. Exercise Sets (in chunks of 100)
  const sets = db.prepare('SELECT * FROM ExerciseSet;').all() as any[];
  if (sets.length > 0) {
    const formatted = sets.map((s) => ({
      ...s,
      logged_at: new Date(s.logged_at),
    }));
    const chunkSize = 100;
    let syncedSets = 0;
    for (let i = 0; i < formatted.length; i += chunkSize) {
      const chunk = formatted.slice(i, i + chunkSize);
      const res = await prisma.exerciseSet.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      syncedSets += res.count;
    }
    console.log(`🔢 Synced Exercise Sets: ${syncedSets}/${sets.length}`);
  }

  // 16. Personal Records
  const prs = db.prepare('SELECT * FROM PersonalRecord;').all() as any[];
  if (prs.length > 0) {
    const formatted = prs.map((pr) => ({
      ...pr,
      achieved_at: new Date(pr.achieved_at),
    }));
    await prisma.personalRecord.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`🏆 Synced Personal Records: ${prs.length}`);
  }

  // 17. FoodLogEntry
  const foodLogs = db.prepare('SELECT * FROM FoodLogEntry;').all() as any[];
  if (foodLogs.length > 0) {
    const formatted = foodLogs.map((fl) => ({
      ...fl,
      logged_date: new Date(fl.logged_date),
      logged_at: new Date(fl.logged_at),
    }));
    await prisma.foodLogEntry.createMany({
      data: formatted,
      skipDuplicates: true,
    });
    console.log(`🍎 Synced Food Log Entries: ${foodLogs.length}`);
  }

  console.log('\n✅ [ALL DATA SYNCHRONIZED TO SUPABASE PRODUCTION DATABASE SUCCESSFULLY]');
}

sync()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  });

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "height_cm" DOUBLE PRECISION,
    "unit_system" TEXT DEFAULT 'metric',
    "fitness_goal" TEXT,
    "activity_level" TEXT,
    "experience_level" TEXT,
    "training_style" TEXT DEFAULT 'hypertrophy',
    "schedule_days_per_week" INTEGER DEFAULT 4,
    "session_duration_min" INTEGER DEFAULT 60,
    "injuries" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipment_types" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyWeightLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "BodyWeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightGoal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_weight_kg" DOUBLE PRECISION NOT NULL,
    "set_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "chest_cm" DOUBLE PRECISION,
    "waist_cm" DOUBLE PRECISION,
    "hips_cm" DOUBLE PRECISION,
    "left_arm_cm" DOUBLE PRECISION,
    "right_arm_cm" DOUBLE PRECISION,
    "left_thigh_cm" DOUBLE PRECISION,
    "right_thigh_cm" DOUBLE PRECISION,
    "neck_cm" DOUBLE PRECISION,
    "body_fat_pct" DOUBLE PRECISION,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primary_muscle" TEXT NOT NULL,
    "secondary_muscles" TEXT,
    "equipment" TEXT NOT NULL,
    "exercise_type" TEXT NOT NULL DEFAULT 'reps',
    "default_duration_seconds" INTEGER,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT,
    "instructions" TEXT,
    "illustration_url" TEXT,
    "thumbnail_url" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutProgram" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" TEXT,
    "type" TEXT,
    "goal" TEXT,
    "schedule_days_per_week" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_generation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPlanGeneration" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt_snapshot" JSONB NOT NULL,
    "raw_response" TEXT NOT NULL,
    "model_used" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPlanGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPeriodizationSuggestion" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "suggested_weight_kg" DOUBLE PRECISION,
    "suggested_reps" INTEGER,
    "reason" TEXT,
    "based_on_session_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "AiPeriodizationSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutDay" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "day_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "WorkoutDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutDayExercise" (
    "id" TEXT NOT NULL,
    "workout_day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "superset_group_id" TEXT,
    "target_sets" INTEGER,
    "target_reps" TEXT,
    "target_duration_seconds" INTEGER,
    "target_weight_kg" DOUBLE PRECISION,
    "rest_seconds" INTEGER DEFAULT 90,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "WorkoutDayExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workout_day_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "session_date" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "calories_burned" INTEGER,
    "rating" INTEGER,
    "notes" TEXT,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSet" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "set_type" TEXT NOT NULL DEFAULT 'normal',
    "reps" INTEGER,
    "duration_seconds" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "rpe" DOUBLE PRECISION,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalRecord" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "estimated_1rm_kg" DOUBLE PRECISION,
    "session_id" TEXT,
    "achieved_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionGoal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_calories" INTEGER,
    "protein_g" DOUBLE PRECISION,
    "carbs_g" DOUBLE PRECISION,
    "fats_g" DOUBLE PRECISION,
    "water_ml" INTEGER NOT NULL DEFAULT 2500,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLogEntry" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "logged_date" TIMESTAMP(3) NOT NULL,
    "meal_slot" TEXT NOT NULL,
    "food_name" TEXT NOT NULL,
    "usda_fdc_id" INTEGER,
    "quantity_g" DOUBLE PRECISION,
    "calories_kcal" DOUBLE PRECISION,
    "protein_g" DOUBLE PRECISION,
    "carbs_g" DOUBLE PRECISION,
    "fats_g" DOUBLE PRECISION,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserXp" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "current_rank" TEXT NOT NULL DEFAULT 'Rookie',
    "xp_this_week" INTEGER NOT NULL DEFAULT 0,
    "week_reset_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserXp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trophy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "requirement_value" INTEGER,
    "xp_reward" INTEGER,
    "icon_url" TEXT,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrophy" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trophy_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTrophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" TIMESTAMP(3) NOT NULL,
    "grace_used_this_week" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotConversation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotMessage" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrengthStandard" (
    "id" TEXT NOT NULL,
    "lift" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "bodyweight_kg_min" DOUBLE PRECISION,
    "bodyweight_kg_max" DOUBLE PRECISION,
    "beginner_1rm" DOUBLE PRECISION,
    "novice_1rm" DOUBLE PRECISION,
    "intermediate_1rm" DOUBLE PRECISION,
    "advanced_1rm" DOUBLE PRECISION,
    "elite_1rm" DOUBLE PRECISION,
    "source" TEXT,

    CONSTRAINT "StrengthStandard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WeightGoal_user_id_key" ON "WeightGoal"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalRecord_user_id_exercise_id_weight_kg_reps_key" ON "PersonalRecord"("user_id", "exercise_id", "weight_kg", "reps");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionGoal_user_id_key" ON "NutritionGoal"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserXp_user_id_key" ON "UserXp"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrophy_user_id_trophy_id_key" ON "UserTrophy"("user_id", "trophy_id");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_user_id_key" ON "Streak"("user_id");

-- AddForeignKey
ALTER TABLE "EquipmentProfile" ADD CONSTRAINT "EquipmentProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyWeightLog" ADD CONSTRAINT "BodyWeightLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightGoal" ADD CONSTRAINT "WeightGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutProgram" ADD CONSTRAINT "WorkoutProgram_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutProgram" ADD CONSTRAINT "WorkoutProgram_ai_generation_id_fkey" FOREIGN KEY ("ai_generation_id") REFERENCES "AiPlanGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPlanGeneration" ADD CONSTRAINT "AiPlanGeneration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPeriodizationSuggestion" ADD CONSTRAINT "AiPeriodizationSuggestion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPeriodizationSuggestion" ADD CONSTRAINT "AiPeriodizationSuggestion_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPeriodizationSuggestion" ADD CONSTRAINT "AiPeriodizationSuggestion_based_on_session_id_fkey" FOREIGN KEY ("based_on_session_id") REFERENCES "WorkoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDay" ADD CONSTRAINT "WorkoutDay_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "WorkoutProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDayExercise" ADD CONSTRAINT "WorkoutDayExercise_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "WorkoutDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutDayExercise" ADD CONSTRAINT "WorkoutDayExercise_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "WorkoutDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "WorkoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionGoal" ADD CONSTRAINT "NutritionGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLogEntry" ADD CONSTRAINT "FoodLogEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserXp" ADD CONSTRAINT "UserXp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_trophy_id_fkey" FOREIGN KEY ("trophy_id") REFERENCES "Trophy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotConversation" ADD CONSTRAINT "ChatbotConversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotMessage" ADD CONSTRAINT "ChatbotMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ChatbotConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;


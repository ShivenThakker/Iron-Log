-- Unique index to prevent duplicate Personal Records for the same set metrics
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalRecord_user_id_exercise_id_weight_kg_reps_key"
  ON "PersonalRecord" ("user_id", "exercise_id", "weight_kg", "reps");

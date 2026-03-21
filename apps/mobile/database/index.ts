import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import { WorkoutSession, ExerciseSet } from './models';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  jsi: true, 
  onSetUpError: error => { console.error('WatermelonDB Failed', error); }
});

export const database = new Database({
  adapter,
  modelClasses: [WorkoutSession, ExerciseSet],
});

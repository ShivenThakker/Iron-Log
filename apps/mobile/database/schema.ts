import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'backend_id', type: 'string', isOptional: true },
        { name: 'started_at', type: 'number' },
        { name: 'finished_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'exercise_sets',
      columns: [
        { name: 'backend_id', type: 'string', isOptional: true },
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string' },
        { name: 'set_number', type: 'number' },
        { name: 'weight_kg', type: 'number', isOptional: true },
        { name: 'reps', type: 'number', isOptional: true },
        { name: 'set_type', type: 'string' },
        { name: 'is_synced', type: 'boolean' }
      ]
    })
  ]
});

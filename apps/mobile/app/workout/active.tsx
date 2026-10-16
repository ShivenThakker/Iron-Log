import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';
import { api } from '@/services/api';

type WorkoutSet = { id: string; weight: string; reps: string; complete: boolean; synced: boolean };
type ExerciseBlock = { id: string; exerciseId: string; name: string; sets: WorkoutSet[] };
type ExerciseOption = { id: string; name: string };

const EXERCISE_POOL = [
  'Barbell Bench Press',
  'Lat Pulldown',
  'Dumbbell Shoulder Press',
  'Barbell Squat',
  'Romanian Deadlift',
  'Cable Row',
];

export default function ActiveWorkout() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(true);
  const [finishingSession, setFinishingSession] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [workout, setWorkout] = useState<ExerciseBlock[]>([
    {
      id: 'ex-1',
      exerciseId: 'local-bench',
      name: 'Barbell Bench Press',
      sets: [{ id: 'set-1', weight: '', reps: '', complete: false, synced: false }],
    },
  ]);

  const usedExerciseNames = useMemo(() => new Set(workout.map((block) => block.name)), [workout]);
  const filteredExerciseOptions = useMemo(() => {
    const query = exerciseQuery.trim().toLowerCase();
    return exerciseOptions.filter((option) => {
      if (usedExerciseNames.has(option.name)) return false;
      if (!query) return true;
      return option.name.toLowerCase().includes(query);
    });
  }, [exerciseOptions, exerciseQuery, usedExerciseNames]);

  useEffect(() => {
    const bootstrapWorkout = async () => {
      try {
        const [sessionRes, exerciseRes] = await Promise.all([
          api.post('/sessions', {}),
          api.get('/exercises'),
        ]);

        setSessionId(sessionRes.data?.id ?? null);

        const options: ExerciseOption[] = Array.isArray(exerciseRes.data)
          ? exerciseRes.data.slice(0, 100).map((item: any) => ({ id: item.id, name: item.name }))
          : [];

        if (options.length > 0) {
          setExerciseOptions(options);
          setWorkout((prev) => {
            if (prev.length === 0) return prev;
            const firstMatch = options.find((opt) => opt.name === prev[0].name) || options[0];
            const next = [...prev];
            next[0] = { ...next[0], exerciseId: firstMatch.id, name: firstMatch.name };
            return next;
          });
        } else {
          setExerciseOptions(EXERCISE_POOL.map((name, idx) => ({ id: `local-${idx + 1}`, name })));
        }
      } catch {
        setExerciseOptions(EXERCISE_POOL.map((name, idx) => ({ id: `local-${idx + 1}`, name })));
      } finally {
        setStartingSession(false);
      }
    };

    bootstrapWorkout();
  }, []);

  const addSet = (exerciseIndex: number) => {
    setWorkout((prev) => {
      const next = [...prev];
      const target = next[exerciseIndex];
      target.sets = [
        ...target.sets,
        {
          id: `set-${Date.now()}-${target.sets.length + 1}`,
          weight: '',
          reps: '',
          complete: false,
          synced: false,
        },
      ];
      return next;
    });
  };

  const openExercisePicker = () => {
    setExerciseQuery('');
    setPickerVisible(true);
  };

  const addExercise = (exercise: ExerciseOption) => {
    setPickerVisible(false);

    setWorkout((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        sets: [{ id: `set-${Date.now()}-1`, weight: '', reps: '', complete: false, synced: false }],
      },
    ]);
  };

  const updateSetField = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setWorkout((prev) => {
      const next = [...prev];
      const targetSet = next[exerciseIndex].sets[setIndex];
      targetSet[field] = value;
      return next;
    });
  };

  const toggleSet = async (exerciseIndex: number, setIndex: number) => {
    const block = workout[exerciseIndex];
    const row = block.sets[setIndex];
    const becomingComplete = !row.complete;

    setWorkout((prev) => {
      const next = [...prev];
      const targetSet = next[exerciseIndex].sets[setIndex];
      targetSet.complete = becomingComplete;
      return next;
    });

    if (!becomingComplete || row.synced || !sessionId || block.exerciseId.startsWith('local-')) {
      return;
    }

    const repsNum = Number(row.reps);
    const weightNum = Number(row.weight);

    if (!Number.isFinite(repsNum) || repsNum <= 0) return;

    try {
      await api.post(`/sessions/${sessionId}/sets`, {
        exercise_id: block.exerciseId,
        set_number: setIndex + 1,
        set_type: 'normal',
        reps: repsNum,
        weight_kg: Number.isFinite(weightNum) && weightNum > 0 ? weightNum : undefined,
      });

      setWorkout((prev) => {
        const next = [...prev];
        next[exerciseIndex].sets[setIndex].synced = true;
        return next;
      });
    } catch {
      // keep local completion state even if sync fails in MVP mode
    }
  };

  const finishWorkout = async () => {
    setFinishingSession(true);
    try {
      if (sessionId) {
        await api.put(`/sessions/${sessionId}/finish`);
      }
      router.replace('/(tabs)/rank');
    } finally {
      setFinishingSession(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.timer}>00:00</Text>
          <Text style={styles.sessionState}>{startingSession ? 'Starting session...' : 'Session live'}</Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout} disabled={finishingSession || startingSession}>
          <Text style={styles.finishText}>{finishingSession ? 'Saving...' : 'Finish'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {workout.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={styles.exerciseBlock}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>

            <View style={styles.setRowHeader}>
              <Text style={[styles.setColText, { flex: 1 }]}>Set</Text>
              <Text style={[styles.setColText, { flex: 2 }]}>kg</Text>
              <Text style={[styles.setColText, { flex: 2 }]}>Reps</Text>
              <Text style={[styles.setColText, { flex: 1 }]}>Check</Text>
            </View>

            {exercise.sets.map((setRow, setIndex) => (
              <View key={setRow.id} style={[styles.setRow, setRow.complete && styles.setRowComplete]}>
                <View style={[styles.cell, { flex: 1 }]}>
                  <Text style={styles.setText}>{setIndex + 1}</Text>
                </View>
                <View style={[styles.cell, { flex: 2 }]}> 
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={setRow.weight}
                    editable={!setRow.complete}
                    onChangeText={(value) => updateSetField(exerciseIndex, setIndex, 'weight', value)}
                  />
                </View>
                <View style={[styles.cell, { flex: 2 }]}> 
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={setRow.reps}
                    editable={!setRow.complete}
                    onChangeText={(value) => updateSetField(exerciseIndex, setIndex, 'reps', value)}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.cell, { flex: 1 }, styles.checkBtn, setRow.complete && styles.checkBtnComplete]}
                  onPress={() => toggleSet(exerciseIndex, setIndex)}
                >
                  <Text style={{ color: setRow.complete ? COLORS.dark.bgPrimary : COLORS.dark.textSecondary }}>✓</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSet} onPress={() => addSet(exerciseIndex)}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addExerciseBtn} onPress={openExercisePicker}>
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Exercise</Text>
            <TextInput
              value={exerciseQuery}
              onChangeText={setExerciseQuery}
              placeholder="Search exercise"
              placeholderTextColor={COLORS.dark.textSecondary}
              style={styles.modalSearch}
            />

            <ScrollView style={styles.modalList}>
              {filteredExerciseOptions.map((exercise) => (
                <TouchableOpacity key={exercise.id} style={styles.modalItem} onPress={() => addExercise(exercise)}>
                  <Text style={styles.modalItemText}>{exercise.name}</Text>
                </TouchableOpacity>
              ))}
              {filteredExerciseOptions.length === 0 && <Text style={styles.modalEmpty}>No exercises found.</Text>}
            </ScrollView>

            <TouchableOpacity style={styles.modalClose} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.md, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  timer: { color: COLORS.dark.textPrimary, fontSize: 32, fontWeight: 'bold' },
  sessionState: { color: COLORS.dark.textSecondary, marginTop: SPACING.xs },
  finishBtn: { backgroundColor: COLORS.dark.accentGold, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  finishText: { color: COLORS.dark.textPrimary, fontWeight: 'bold', fontSize: 16 },
  exerciseBlock: { backgroundColor: COLORS.dark.bgSecondary, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  exerciseName: { color: COLORS.dark.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: SPACING.md },
  setRowHeader: { flexDirection: 'row', marginBottom: SPACING.sm, paddingHorizontal: SPACING.sm },
  setColText: { color: COLORS.dark.textSecondary, fontSize: 12, textAlign: 'center', fontWeight: 'bold'},
  setRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.bgPrimary, borderRadius: RADIUS.sm, marginBottom: SPACING.xs, padding: SPACING.xs },
  setRowComplete: { opacity: 0.5 },
  cell: { justifyContent: 'center', alignItems: 'center' },
  setText: { color: COLORS.dark.textPrimary, fontWeight: 'bold' },
  input: { width: '80%', backgroundColor: COLORS.dark.bgInput, color: COLORS.dark.textPrimary, textAlign: 'center', borderRadius: RADIUS.sm, paddingVertical: SPACING.xs },
  checkBtn: { backgroundColor: COLORS.dark.bgInput, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, marginHorizontal: SPACING.xs },
  checkBtnComplete: { backgroundColor: COLORS.dark.success },
  addSet: { marginTop: SPACING.md, padding: SPACING.md, alignItems: 'center' },
  addSetText: { color: COLORS.dark.textSecondary, fontWeight: 'bold' },
  addExerciseBtn: { backgroundColor: COLORS.dark.bgSecondary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.xl },
  addExerciseText: { color: COLORS.dark.accentRed, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, opacity: 0.95, justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.dark.bgSecondary, borderRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '80%' },
  modalTitle: { color: COLORS.dark.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: SPACING.md },
  modalSearch: { backgroundColor: COLORS.dark.bgInput, color: COLORS.dark.textPrimary, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  modalList: { marginBottom: SPACING.md },
  modalItem: { backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  modalItemText: { color: COLORS.dark.textPrimary, fontSize: 16, fontWeight: '600' },
  modalEmpty: { color: COLORS.dark.textSecondary, textAlign: 'center', paddingVertical: SPACING.lg },
  modalClose: { backgroundColor: COLORS.dark.accentRed, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  modalCloseText: { color: COLORS.dark.textPrimary, fontSize: 16, fontWeight: '700' }
});

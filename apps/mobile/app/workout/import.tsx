import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
} from '@/constants/tokens';
import { DatePickerCalendar } from '@/components/ui/DatePickerCalendar';
import { api } from '@/services/api';

type ImportMode = 'manual' | 'spreadsheet';
type SetType = 'normal' | 'warmup' | 'dropset' | 'drop' | 'failure';

interface ExerciseSetInput {
  set_number: number;
  weight_kg: string;
  reps: string;
  set_type: SetType;
}

interface WorkoutExerciseInput {
  exercise_id: string;
  name: string;
  muscle: string;
  equipment: string;
  sets: ExerciseSetInput[];
}

interface DbExercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment?: string;
}

interface ImportSummary {
  sessions_created: number;
  sets_created: number;
  prs_created: number;
  xp_awarded: number;
  date_range?: {
    start: string;
    end: string;
  };
}

const MUSCLE_FILTERS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Core',
  'Forearms',
];

export default function HistoricalWorkoutImportScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ImportMode>('manual');

  // Manual Mode State
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [workoutTitle, setWorkoutTitle] = useState('Upper Body Hypertrophy');
  const [durationMin, setDurationMin] = useState('60');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<WorkoutExerciseInput[]>([]);

  // Exercise Picker Modal State
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [exerciseDb, setExerciseDb] = useState<DbExercise[]>([]);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');

  // Spreadsheet Upload State
  const [pickedFile, setPickedFile] = useState<{
    name: string;
    size?: number;
    uri: string;
    mimeType?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Fetch exercises from database
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const res = await api.get('/exercises');
        if (Array.isArray(res.data)) {
          setExerciseDb(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch exercises:', err);
      }
    };
    loadExercises();
  }, []);

  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Add exercise to manual routine
  const handleAddExercise = (item: DbExercise | { id?: string; name: string; primary_muscle: string; equipment?: string }) => {
    const newEx: WorkoutExerciseInput = {
      exercise_id: item.id || '',
      name: item.name,
      muscle: item.primary_muscle || 'Full Body',
      equipment: item.equipment || 'Other',
      sets: [
        {
          set_number: 1,
          weight_kg: '60',
          reps: '10',
          set_type: 'normal',
        },
      ],
    };
    setExercises((prev) => [...prev, newEx]);
    setIsExercisePickerOpen(false);
    setSearchQuery('');
    setCustomExerciseName('');

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    handleAddExercise({
      name: customExerciseName.trim(),
      primary_muscle: selectedMuscleFilter === 'All' ? 'Full Body' : selectedMuscleFilter,
      equipment: 'Other',
    });
  };

  const handleRemoveExercise = (exIndex: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== exIndex));
  };

  const handleAddSet = (exIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIndex) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSetInput = {
          set_number: ex.sets.length + 1,
          weight_kg: lastSet ? lastSet.weight_kg : '50',
          reps: lastSet ? lastSet.reps : '10',
          set_type: 'normal',
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIndex) return ex;
        if (ex.sets.length <= 1) return ex;
        const updated = ex.sets
          .filter((_, sIdx) => sIdx !== setIndex)
          .map((s, i) => ({ ...s, set_number: i + 1 }));
        return { ...ex, sets: updated };
      })
    );
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: 'weight_kg' | 'reps' | 'set_type',
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIndex) return ex;
        const updatedSets = ex.sets.map((s, sIdx) => {
          if (sIdx !== setIndex) return s;
          return { ...s, [field]: value };
        });
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const toggleSetType = (exIndex: number, setIndex: number, currentType: SetType) => {
    const cycle: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];
    const normalizedType = currentType === 'drop' ? 'dropset' : currentType;
    const nextIdx = (cycle.indexOf(normalizedType) + 1) % cycle.length;
    handleUpdateSet(exIndex, setIndex, 'set_type', cycle[nextIdx]);
  };

  // Submit Manual Workout
  const handleSaveManualWorkout = async () => {
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise to log this workout.');
      return;
    }

    setIsSavingManual(true);
    try {
      const isoDate = selectedDate.toISOString();
      const payload = {
        date: isoDate,
        session_date: isoDate,
        workout_name: workoutTitle.trim() || 'Past Workout',
        duration_minutes: parseInt(durationMin, 10) || 60,
        notes: notes.trim() || undefined,
        exercises: exercises.map((ex) => ({
          exercise_id: ex.exercise_id || undefined,
          exercise_name: ex.name,
          sets: ex.sets.map((s, sIdx) => ({
            set_number: s.set_number || sIdx + 1,
            weight_kg: parseFloat(s.weight_kg) || 0,
            reps: parseInt(s.reps, 10) || 0,
            set_type: s.set_type === 'drop' ? 'dropset' : s.set_type,
            rpe: s.set_type === 'failure' ? 10 : 9,
          })),
        })),
      };

      const res = await api.post('/sessions/retroactive', payload);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      const summary = res.data?.summary;
      Alert.alert(
        'Workout Saved!',
        `Logged ${summary?.total_sets || 0} sets across ${exercises.length} exercises.\n+${summary?.xp_earned || 50} XP earned${summary?.pr_count ? ` with ${summary.pr_count} new PRs!` : '!'}`,
        [
          {
            text: 'Go to Dashboard',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to save workout session';
      Alert.alert('Save Failed', msg);
    } finally {
      setIsSavingManual(false);
    }
  };

  // Pick Spreadsheet Document (.csv, .xlsx, .xls)
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setPickedFile({
          name: file.name,
          size: file.size,
          uri: file.uri,
          mimeType: file.mimeType,
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to open document picker');
    }
  };

  // Upload & Import Spreadsheet
  const handleUploadSpreadsheet = async () => {
    if (!pickedFile) {
      Alert.alert('Select File', 'Please select a CSV or Excel spreadsheet first.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(pickedFile.uri);
      const blob = await response.blob();

      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = reader.result as string;
          resolve(resStr);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await api.post('/sessions/import', {
        filename: pickedFile.name,
        fileName: pickedFile.name,
        fileData: base64Content,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      setImportSummary(res.data);
      setShowSummaryModal(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to import spreadsheet';
      Alert.alert('Import Failed', msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Filtered exercises for picker modal (with deduplication safeguard)
  const filteredExercises = React.useMemo(() => {
    const seen = new Set<string>();
    return exerciseDb.filter((ex) => {
      const key = ex.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      const matchesCategory =
        selectedMuscleFilter === 'All' ||
        ex.primary_muscle.toLowerCase() === selectedMuscleFilter.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.primary_muscle.toLowerCase().includes(searchQuery.toLowerCase());
      if (matchesCategory && matchesSearch) {
        seen.add(key);
        return true;
      }
      return false;
    });
  }, [exerciseDb, selectedMuscleFilter, searchQuery]);

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.canvas }}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Icon name="CaretLeft" size={24} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>LOG PAST DATA</Text>
          <Text style={styles.headerSubtitle}>Historical Sessions & Progression</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Mode Selector */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'manual' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            setMode('manual');
            if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
          }}
        >
          <Icon
            name="Barbell"
            size={18}
            color={mode === 'manual' ? OBSIDIAN_COLORS.onPrimary : OBSIDIAN_COLORS.textMuted}
            weight={mode === 'manual' ? 'bold' : 'regular'}
          />
          <Text style={[styles.segmentBtnText, mode === 'manual' && styles.segmentBtnTextActive]}>
            Manual Entry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'spreadsheet' && styles.segmentBtnActive]}
          activeOpacity={0.8}
          onPress={() => {
            setMode('spreadsheet');
            if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
          }}
        >
          <Icon
            name="Table"
            size={18}
            color={mode === 'spreadsheet' ? OBSIDIAN_COLORS.onPrimary : OBSIDIAN_COLORS.textMuted}
            weight={mode === 'spreadsheet' ? 'bold' : 'regular'}
          />
          <Text
            style={[styles.segmentBtnText, mode === 'spreadsheet' && styles.segmentBtnTextActive]}
          >
            Spreadsheet Import
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'manual' ? (
          /* MANUAL ENTRY TAB */
          <View style={styles.tabContent}>
            {/* Session Date Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Icon name="Calendar" size={18} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                  <Text style={styles.cardHeaderTitle}>SESSION DATE</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{formattedSelectedDate}</Text>
                </View>
              </View>

              {/* Interactive Calendar Date Picker */}
              <DatePickerCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                maxDate={new Date()}
              />
            </View>

            {/* Session Meta Card (Name & Duration) */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>WORKOUT DETAILS</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Routine / Focus Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Upper Body Hypertrophy"
                  placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                  value={workoutTitle}
                  onChangeText={setWorkoutTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration (Minutes)</Text>
                <View style={styles.durationPillsRow}>
                  {['30', '45', '60', '75', '90'].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.durationPill,
                        durationMin === mins && styles.durationPillActive,
                      ]}
                      onPress={() => setDurationMin(mins)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.durationPillText,
                          durationMin === mins && styles.durationPillTextActive,
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Exercises Section */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>EXERCISES</Text>
                <Text style={styles.sectionSubtitle}>
                  {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} logged
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addExerciseSmallBtn}
                activeOpacity={0.8}
                onPress={() => setIsExercisePickerOpen(true)}
              >
                <Icon name="Plus" size={16} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                <Text style={styles.addExerciseSmallBtnText}>Add Lift</Text>
              </TouchableOpacity>
            </View>

            {exercises.length === 0 ? (
              <View style={styles.emptyExerciseBox}>
                <Icon name="Barbell" size={32} color={OBSIDIAN_COLORS.textMuted} />
                <Text style={styles.emptyExerciseTitle}>No exercises added yet</Text>
                <Text style={styles.emptyExerciseText}>
                  Add the exercises and weights you performed in this workout.
                </Text>
                <TouchableOpacity
                  style={styles.primaryAddBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsExercisePickerOpen(true)}
                >
                  <Icon name="Plus" size={18} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                  <Text style={styles.primaryAddBtnText}>Select From Library</Text>
                </TouchableOpacity>
              </View>
            ) : (
              exercises.map((ex, exIdx) => (
                <View key={exIdx} style={styles.exerciseCard}>
                  {/* Exercise Title Row */}
                  <View style={styles.exerciseCardHeader}>
                    <View style={styles.exerciseTitleCol}>
                      <Text style={styles.exerciseCardTitle}>{ex.name}</Text>
                      <View style={styles.exerciseBadgesRow}>
                        <View style={styles.muscleBadge}>
                          <Text style={styles.muscleBadgeText}>{ex.muscle}</Text>
                        </View>
                        <Text style={styles.equipmentText}>{ex.equipment}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.trashBtn}
                      activeOpacity={0.7}
                      onPress={() => handleRemoveExercise(exIdx)}
                    >
                      <Icon name="Trash" size={18} color={OBSIDIAN_COLORS.coralAccent} />
                    </TouchableOpacity>
                  </View>

                  {/* Sets Table Header */}
                  <View style={styles.setsHeaderRow}>
                    <Text style={[styles.setColHeader, { width: 34 }]}>SET</Text>
                    <Text style={[styles.setColHeader, { width: 70 }]}>TYPE</Text>
                    <Text style={[styles.setColHeader, { flex: 1, textAlign: 'center' }]}>WEIGHT (KG)</Text>
                    <Text style={[styles.setColHeader, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                    <View style={{ width: 30 }} />
                  </View>

                  {/* Sets Rows */}
                  {ex.sets.map((set, sIdx) => (
                    <View key={sIdx} style={styles.setRow}>
                      <View style={styles.setNumberBadge}>
                        <Text style={styles.setNumberText}>{set.set_number}</Text>
                      </View>

                      {/* Set Type Switcher */}
                      <TouchableOpacity
                        style={[
                          styles.setTypeChip,
                          set.set_type === 'failure' && styles.setTypeFailure,
                          set.set_type === 'warmup' && styles.setTypeWarmup,
                          (set.set_type === 'drop' || set.set_type === 'dropset') && styles.setTypeDrop,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => toggleSetType(exIdx, sIdx, set.set_type)}
                      >
                        <Text
                          style={[
                            styles.setTypeChipText,
                            set.set_type === 'failure' && styles.setTypeChipTextFailure,
                          ]}
                        >
                          {set.set_type === 'dropset' ? 'DROP' : set.set_type.toUpperCase()}
                        </Text>
                      </TouchableOpacity>

                      {/* Weight Input */}
                      <TextInput
                        style={styles.setNumericInput}
                        keyboardType="decimal-pad"
                        value={set.weight_kg}
                        onChangeText={(v) => handleUpdateSet(exIdx, sIdx, 'weight_kg', v)}
                        textAlignVertical="center"
                        selectTextOnFocus
                        placeholder="0"
                        placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                      />

                      {/* Reps Input */}
                      <TextInput
                        style={styles.setNumericInput}
                        keyboardType="number-pad"
                        value={set.reps}
                        onChangeText={(v) => handleUpdateSet(exIdx, sIdx, 'reps', v)}
                        textAlignVertical="center"
                        selectTextOnFocus
                        placeholder="0"
                        placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                      />

                      {/* Delete Set */}
                      <TouchableOpacity
                        style={styles.setDeleteBtn}
                        activeOpacity={0.7}
                        onPress={() => handleRemoveSet(exIdx, sIdx)}
                      >
                        <Icon name="Minus" size={16} color={OBSIDIAN_COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add Set Button */}
                  <TouchableOpacity
                    style={styles.addSetBtn}
                    activeOpacity={0.7}
                    onPress={() => handleAddSet(exIdx)}
                  >
                    <Icon name="Plus" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                    <Text style={styles.addSetBtnText}>Add Set</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Optional Notes */}
            {exercises.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.inputLabel}>Session Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Notes about pump, strength, or equipment..."
                  placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            )}

            {/* Submit Button */}
            {exercises.length > 0 && (
              <TouchableOpacity
                style={styles.saveMainBtn}
                activeOpacity={0.85}
                disabled={isSavingManual}
                onPress={handleSaveManualWorkout}
              >
                {isSavingManual ? (
                  <ActivityIndicator color={OBSIDIAN_COLORS.onPrimary} />
                ) : (
                  <>
                    <Icon
                      name="CheckCircle"
                      size={20}
                      color={OBSIDIAN_COLORS.onPrimary}
                      weight="bold"
                    />
                    <Text style={styles.saveMainBtnText}>LOG PAST WORKOUT</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* SPREADSHEET IMPORT TAB */
          <View style={styles.tabContent}>
            {/* Intro Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Icon name="Table" size={20} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                  <Text style={styles.cardHeaderTitle}>SPREADSHEET IMPORT</Text>
                </View>
              </View>
              <Text style={styles.introParagraph}>
                Upload your historical Excel (.xlsx, .xls) or CSV spreadsheet to instantly populate
                all your past workouts, sets, and automatically calculate your Personal Records!
              </Text>

              {/* Upload Dropzone */}
              {!pickedFile ? (
                <TouchableOpacity
                  style={styles.uploadDropzone}
                  activeOpacity={0.8}
                  onPress={handlePickDocument}
                >
                  <View style={styles.uploadIconCircle}>
                    <Icon name="UploadSimple" size={28} color={OBSIDIAN_COLORS.voltLime} />
                  </View>
                  <Text style={styles.uploadDropTitle}>Select CSV or Excel Spreadsheet</Text>
                  <Text style={styles.uploadDropSubtitle}>Supports .csv, .xlsx, .xls files</Text>
                  <View style={styles.browseButton}>
                    <Text style={styles.browseButtonText}>BROWSE FILE</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.selectedFileCard}>
                  <View style={styles.fileLeft}>
                    <View style={styles.fileIconBadge}>
                      <Icon name="FileText" size={24} color={OBSIDIAN_COLORS.voltLime} />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {pickedFile.name}
                      </Text>
                      <Text style={styles.fileMeta}>
                        {pickedFile.size ? `${Math.round(pickedFile.size / 1024)} KB` : 'Ready to import'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeFileBtn}
                    onPress={handlePickDocument}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeFileBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Supported Formats Information Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>SUPPORTED FORMATS</Text>

              {/* Format 1: Standard CSV */}
              <View style={styles.formatItem}>
                <View style={styles.formatBadge}>
                  <Text style={styles.formatBadgeText}>FORMAT 1: TABULAR CSV</Text>
                </View>
                <Text style={styles.formatDesc}>
                  One row per set. Recommended headers:{' '}
                  <Text style={styles.boldVolt}>Date, Exercise, Weight, Reps, Set</Text>
                </Text>
                <View style={styles.sampleTable}>
                  <Text style={styles.sampleRowHeader}>Date | Exercise | Weight | Reps</Text>
                  <Text style={styles.sampleRow}>2026-03-15 | Bench Press | 80 | 10</Text>
                  <Text style={styles.sampleRow}>2026-03-15 | Bench Press | 85 | 8</Text>
                  <Text style={styles.sampleRow}>2026-03-15 | Incline Dumbbell Press | 30 | 12</Text>
                </View>
              </View>

              {/* Format 2: IronLog Multi-Week Matrix */}
              <View style={[styles.formatItem, { marginTop: 16 }]}>
                <View style={styles.formatBadge}>
                  <Text style={styles.formatBadgeText}>FORMAT 2: MULTI-WEEK MATRIX</Text>
                </View>
                <Text style={styles.formatDesc}>
                  Exercises down Column A, and Week 1..N or dates across Column headers. Cells contain
                  sets formatted as <Text style={styles.boldVolt}>80 - 10 and 80 - 10</Text>.
                </Text>
                <View style={styles.sampleTable}>
                  <Text style={styles.sampleRowHeader}>Exercise | Week 1 | Week 2</Text>
                  <Text style={styles.sampleRow}>Bench Press | 80 - 10 and 80 - 10 | 85 - 8 and 85 - 8</Text>
                  <Text style={styles.sampleRow}>Lat Pulldown | 60 - 12 and 60 - 10 | 65 - 10 and 65 - 10</Text>
                </View>
              </View>
            </View>

            {/* Import Action Button */}
            {pickedFile && (
              <TouchableOpacity
                style={styles.saveMainBtn}
                activeOpacity={0.85}
                disabled={isUploading}
                onPress={handleUploadSpreadsheet}
              >
                {isUploading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={OBSIDIAN_COLORS.onPrimary} style={{ marginRight: 8 }} />
                    <Text style={styles.saveMainBtnText}>PARSING & IMPORTING SPREADSHEET...</Text>
                  </View>
                ) : (
                  <>
                    <Icon name="UploadSimple" size={20} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                    <Text style={styles.saveMainBtnText}>IMPORT WORKOUT DATA</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* EXERCISE PICKER MODAL */}
      <Modal
        visible={isExercisePickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsExercisePickerOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>SELECT EXERCISE</Text>
              <Text style={styles.modalSubtitle}>Choose from library or create custom</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsExercisePickerOpen(false)}
            >
              <Icon name="X" size={20} color={OBSIDIAN_COLORS.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBarContainer}>
            <Icon name="MagnifyingGlass" size={18} color={OBSIDIAN_COLORS.textMuted} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search exercise name or muscle..."
              placeholderTextColor={OBSIDIAN_COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="X" size={16} color={OBSIDIAN_COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Muscle Category Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {MUSCLE_FILTERS.map((cat) => {
              const active = selectedMuscleFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedMuscleFilter(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Exercise List */}
          <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
            {filteredExercises.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={styles.exerciseListItem}
                activeOpacity={0.75}
                onPress={() => handleAddExercise(ex)}
              >
                <View style={styles.exerciseListLeft}>
                  <Text style={styles.exerciseListName}>{ex.name}</Text>
                  <View style={styles.exerciseListBadges}>
                    <View style={styles.muscleBadge}>
                      <Text style={styles.muscleBadgeText}>{ex.primary_muscle}</Text>
                    </View>
                    {ex.equipment && (
                      <Text style={styles.exerciseListEquipment}>{ex.equipment}</Text>
                    )}
                  </View>
                </View>
                <Icon name="Plus" size={20} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
              </TouchableOpacity>
            ))}

            {filteredExercises.length === 0 && (
              <View style={styles.noExercisesContainer}>
                <Text style={styles.noExercisesText}>No library exercises matched "{searchQuery}"</Text>
                <View style={styles.customExerciseBox}>
                  <Text style={styles.customExerciseHeading}>Add Custom Lift:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Belt Squat or Cable Fly"
                    placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                    value={customExerciseName}
                    onChangeText={setCustomExerciseName}
                  />
                  <TouchableOpacity
                    style={styles.addCustomBtn}
                    activeOpacity={0.8}
                    onPress={handleAddCustomExercise}
                  >
                    <Icon name="Plus" size={16} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                    <Text style={styles.addCustomBtnText}>Add "{customExerciseName || 'Exercise'}"</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* IMPORT SUCCESS MODAL */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.summaryModalOverlay}>
          <View style={styles.summaryModalCard}>
            <View style={styles.trophyIconCircle}>
              <Icon name="Trophy" size={36} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
            </View>
            <Text style={styles.summaryModalTitle}>IMPORT COMPLETE!</Text>
            <Text style={styles.summaryModalSubtitle}>
              Your historical workout data has been synchronized and Personal Records verified.
            </Text>

            {/* Metrics 4-grid */}
            <View style={styles.summaryMetricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{importSummary?.sessions_created || 0}</Text>
                <Text style={styles.metricLabel}>Sessions</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{importSummary?.sets_created || 0}</Text>
                <Text style={styles.metricLabel}>Total Sets</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: OBSIDIAN_COLORS.cyanAccent }]}>
                  {importSummary?.prs_created || 0}
                </Text>
                <Text style={styles.metricLabel}>PRs Unlocked</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: OBSIDIAN_COLORS.voltLime }]}>
                  +{importSummary?.xp_awarded || 0}
                </Text>
                <Text style={styles.metricLabel}>XP Earned</Text>
              </View>
            </View>

            {importSummary?.date_range?.start && (
              <Text style={styles.dateRangeText}>
                Date Range: {importSummary.date_range.start} → {importSummary.date_range.end}
              </Text>
            )}

            <TouchableOpacity
              style={styles.summaryDoneBtn}
              activeOpacity={0.8}
              onPress={() => {
                setShowSummaryModal(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.summaryDoneBtnText}>VIEW WORKOUTS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: OBSIDIAN_SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    marginHorizontal: OBSIDIAN_SPACING.lg,
    marginVertical: 12,
    borderRadius: OBSIDIAN_RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: OBSIDIAN_RADIUS.full,
    gap: 8,
  },
  segmentBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  segmentBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textMuted,
  },
  segmentBtnTextActive: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.lg,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 14,
  },
  card: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.onSurface,
    letterSpacing: 1,
  },
  dateBadge: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  dateBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.voltLime,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    paddingVertical: 8,
    borderRadius: OBSIDIAN_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: OBSIDIAN_COLORS.voltLime,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
  },
  chipText: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: OBSIDIAN_COLORS.voltLime,
    fontWeight: '700',
  },
  customDateInputContainer: {
    marginTop: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.onSurface,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 14,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  durationPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationPillActive: {
    borderColor: OBSIDIAN_COLORS.voltLime,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
  },
  durationPillText: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  durationPillTextActive: {
    color: OBSIDIAN_COLORS.voltLime,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  addExerciseSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.full,
    gap: 6,
  },
  addExerciseSmallBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.onPrimary,
  },
  emptyExerciseBox: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  emptyExerciseTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
  },
  emptyExerciseText: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: OBSIDIAN_RADIUS.full,
    gap: 8,
    marginTop: 8,
  },
  primaryAddBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onPrimary,
  },
  exerciseCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
    gap: 10,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseTitleCol: {
    flex: 1,
    gap: 4,
  },
  exerciseCardTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
  },
  exerciseBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.voltLime,
  },
  equipmentText: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  trashBtn: {
    padding: 6,
  },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  setColHeader: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.textMuted,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setNumberBadge: {
    width: 34,
    height: 40,
    borderRadius: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onSurface,
  },
  setTypeChip: {
    width: 70,
    height: 40,
    borderRadius: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypeFailure: {
    backgroundColor: 'rgba(255, 70, 85, 0.15)',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.coralAccent,
  },
  setTypeWarmup: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  setTypeDrop: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  setTypeChipText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.onSurface,
  },
  setTypeChipTextFailure: {
    color: OBSIDIAN_COLORS.coralAccent,
  },
  setNumericInput: {
    flex: 1,
    height: 40,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: 8,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
    includeFontPadding: false,
  },
  setDeleteBtn: {
    width: 30,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    gap: 6,
    marginTop: 4,
  },
  addSetBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingVertical: 14,
    borderRadius: OBSIDIAN_RADIUS.full,
    gap: 8,
    marginTop: 10,
  },
  saveMainBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 0.5,
  },
  introParagraph: {
    fontSize: 13,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 18,
  },
  uploadDropzone: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    gap: 10,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDropTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
  },
  uploadDropSubtitle: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
  },
  browseButton: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: OBSIDIAN_RADIUS.full,
    marginTop: 4,
  },
  browseButtonText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 1,
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    padding: 12,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  fileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fileIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  fileMeta: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.voltLime,
    marginTop: 2,
    fontWeight: '500',
  },
  changeFileBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  changeFileBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textWhite,
  },
  formatItem: {
    gap: 6,
  },
  formatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  formatBadgeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.cyanAccent,
    letterSpacing: 0.5,
  },
  formatDesc: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.onSurface,
    lineHeight: 16,
  },
  boldVolt: {
    color: OBSIDIAN_COLORS.voltLime,
    fontWeight: '700',
  },
  sampleTable: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: 6,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  sampleRowHeader: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.textMuted,
  },
  sampleRow: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textSlate,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  modalTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.md,
    gap: 8,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  searchBarInput: {
    flex: 1,
    paddingVertical: 10,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 13,
  },
  categoryScroll: {
    maxHeight: 46,
    marginTop: 10,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    borderColor: OBSIDIAN_COLORS.voltLime,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
  },
  categoryChipText: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: OBSIDIAN_COLORS.voltLime,
    fontWeight: '700',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    padding: 12,
    borderRadius: OBSIDIAN_RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  exerciseListLeft: {
    flex: 1,
    gap: 4,
  },
  exerciseListName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  exerciseListBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseListEquipment: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  noExercisesContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 16,
  },
  noExercisesText: {
    fontSize: 13,
    color: OBSIDIAN_COLORS.textMuted,
    fontWeight: '500',
  },
  customExerciseBox: {
    width: '100%',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    padding: 16,
    borderRadius: OBSIDIAN_RADIUS.lg,
    gap: 10,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  customExerciseHeading: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 0.5,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingVertical: 10,
    borderRadius: OBSIDIAN_RADIUS.md,
    gap: 6,
  },
  addCustomBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onPrimary,
  },
  summaryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  summaryModalCard: {
    width: '100%',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  trophyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryModalTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 1,
  },
  summaryModalSubtitle: {
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginVertical: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.surfaceContainerLow,
  },
  metricVal: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    color: OBSIDIAN_COLORS.textWhite,
  },
  metricLabel: {
    fontSize: 10,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  dateRangeText: {
    fontSize: 11,
    color: OBSIDIAN_COLORS.onSurface,
    fontWeight: '500',
  },
  summaryDoneBtn: {
    width: '100%',
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingVertical: 14,
    borderRadius: OBSIDIAN_RADIUS.full,
    alignItems: 'center',
    marginTop: 8,
  },
  summaryDoneBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 0.5,
  },
});

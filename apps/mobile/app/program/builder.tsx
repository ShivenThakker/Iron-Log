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
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

type BuilderMode = 'single_day' | 'full_week' | 'ai_import';

interface ExerciseItem {
  id: string;
  name: string;
  target_sets: number;
  target_reps: string;
  rest_seconds: number;
}

interface SplitDay {
  day_name: string;
  is_rest: boolean;
  exercises: ExerciseItem[];
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function WorkoutPlanBuilderScreen() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<BuilderMode>('single_day');
  const [loading, setLoading] = useState(false);

  // Exercise library state
  const [exerciseDb, setExerciseDb] = useState<{ id: string; name: string; primary_muscle: string }[]>([]);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetDayIndexForAdd, setTargetDayIndexForAdd] = useState<number | null>(null);

  // --- MODE 1: Single Day Recurring Plan State ---
  const currentDayName = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>(currentDayName);
  const [singleDayFocus, setSingleDayFocus] = useState<string>('Chest & Triceps');
  const [repeatWeekly, setRepeatWeekly] = useState<boolean>(true);
  const [singleDayExercises, setSingleDayExercises] = useState<ExerciseItem[]>([
    { id: '1', name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
    { id: '2', name: 'Incline Bench Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
    { id: '3', name: 'Triceps Pushdown (Straight Bar)', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
  ]);

  // --- MODE 2: Full Week Split State ---
  const [fullProgramName, setFullProgramName] = useState('My 4-Day Hypertrophy Split');
  const [splitDays, setSplitDays] = useState<SplitDay[]>([
    {
      day_name: 'Monday - Push (Chest & Shoulders)',
      is_rest: false,
      exercises: [
        { id: 'f-1', name: 'Bench Press', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
        { id: 'f-2', name: 'Dumbbell Overhead Press', target_sets: 3, target_reps: '10', rest_seconds: 90 },
        { id: 'f-3', name: 'Incline Dumbbell Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
      ],
    },
    {
      day_name: 'Tuesday - Pull (Back & Biceps)',
      is_rest: false,
      exercises: [
        { id: 'f-4', name: 'Lat Pulldown', target_sets: 4, target_reps: '10-12', rest_seconds: 90 },
        { id: 'f-5', name: 'Seated Row', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
        { id: 'f-6', name: 'Dumbbell Bicep Curl', target_sets: 3, target_reps: '12', rest_seconds: 60 },
      ],
    },
    {
      day_name: 'Wednesday - Rest & Recovery',
      is_rest: true,
      exercises: [],
    },
    {
      day_name: 'Thursday - Legs & Core',
      is_rest: false,
      exercises: [
        { id: 'f-7', name: 'Barbell Squats', target_sets: 4, target_reps: '8-10', rest_seconds: 120 },
        { id: 'f-8', name: 'Romanian Deadlifts', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
        { id: 'f-9', name: 'Flat Bench Crunches', target_sets: 3, target_reps: '15-20', rest_seconds: 45 },
      ],
    },
    {
      day_name: 'Friday - Upper Body Pump',
      is_rest: false,
      exercises: [
        { id: 'f-10', name: 'Incline Bench Press', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
        { id: 'f-11', name: 'Assisted Chin-ups', target_sets: 3, target_reps: '8-10', rest_seconds: 90 },
        { id: 'f-12', name: 'Bayesian Curl', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
      ],
    },
    {
      day_name: 'Saturday - Rest & Active Mobility',
      is_rest: true,
      exercises: [],
    },
    {
      day_name: 'Sunday - Rest & Recovery',
      is_rest: true,
      exercises: [],
    },
  ]);
  const [selectedSplitDayIndex, setSelectedSplitDayIndex] = useState(0);

  // --- MODE 3: AI Document / Screenshot Parser State ---
  const [aiInputType, setAiInputType] = useState<'text' | 'image'>('text');
  const [aiRoutineText, setAiRoutineText] = useState('');
  const [aiSelectedImage, setAiSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [aiParsedResult, setAiParsedResult] = useState<any>(null);
  const [aiParsing, setAiParsing] = useState(false);

  // Fetch exercises for picker
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await api.get('/exercises');
        if (Array.isArray(res.data)) {
          setExerciseDb(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch exercise database:', err);
      }
    };
    fetchExercises();
  }, []);

  // Pick Image from Camera Roll
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow gallery access to pick workout screenshots.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAiSelectedImage(res.assets[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not select image');
    }
  };

  // Run AI Parsing via Gemini 2.5 Flash
  const handleRunAiParsing = async () => {
    if (aiInputType === 'text' && !aiRoutineText.trim()) {
      Alert.alert('Text Required', 'Please paste your routine notes or text to parse.');
      return;
    }
    if (aiInputType === 'image' && !aiSelectedImage?.base64) {
      Alert.alert('Screenshot Required', 'Please select a screenshot or photo of your workout plan.');
      return;
    }

    setAiParsing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const payload: any = {};
      if (aiInputType === 'text') {
        payload.text = aiRoutineText;
      } else {
        payload.imageBase64 = aiSelectedImage?.base64;
        payload.mimeType = aiSelectedImage?.mimeType || 'image/jpeg';
      }

      const res = await api.post('/ai/parse-plan', payload);
      if (res.data?.program) {
        setAiParsedResult(res.data.program);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('AI could not extract routine');
      }
    } catch (err: any) {
      Alert.alert('AI Parsing Failed', err?.response?.data?.error || err.message || 'Error parsing workout');
    } finally {
      setAiParsing(false);
    }
  };

  // Apply parsed AI plan to user's active routine
  const handleApplyAiPlan = async () => {
    if (!aiParsedResult) return;
    setLoading(true);
    try {
      await api.post('/programs/full', {
        name: aiParsedResult.program_name || 'AI Extracted Routine',
        difficulty: aiParsedResult.difficulty || 'intermediate',
        schedule_days_per_week: aiParsedResult.schedule_days_per_week || aiParsedResult.days?.length || 4,
        is_active: true,
        is_ai_generated: true,
        days: aiParsedResult.days.map((d: any, idx: number) => ({
          day_name: d.day_name,
          sort_order: idx,
          exercises: d.exercises.map((ex: any, eIdx: number) => ({
            exercise_name: ex.name,
            target_sets: ex.target_sets || 3,
            target_reps: String(ex.target_reps || '8-12'),
            rest_seconds: ex.rest_seconds || 90,
            sort_order: eIdx,
          })),
        })),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Plan Applied!', 'Your AI-parsed workout plan is now active.', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save Single Day Recurring
  const handleSaveSingleDay = async () => {
    if (singleDayExercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise for this day.');
      return;
    }

    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const dayDisplayName = `${selectedDayOfWeek} - ${singleDayFocus.trim() || 'Custom Routine'}`;
      await api.post('/programs/day', {
        day_name: dayDisplayName,
        repeat_weekly: repeatWeekly,
        exercises: singleDayExercises.map((ex, idx) => ({
          exercise_name: ex.name,
          target_sets: Number(ex.target_sets) || 3,
          target_reps: String(ex.target_reps || '8-12'),
          rest_seconds: Number(ex.rest_seconds) || 90,
          sort_order: idx,
        })),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Day Plan Saved!',
        `Your workout for ${selectedDayOfWeek} is saved and set to repeat every week.`,
        [{ text: 'Awesome', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save Full Week Split
  const handleSaveFullSplit = async () => {
    const activeDays = splitDays.filter((d) => !d.is_rest);
    if (activeDays.length === 0) {
      Alert.alert('Empty Split', 'Please configure at least one active workout day in your split.');
      return;
    }

    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post('/programs/full', {
        name: fullProgramName.trim() || 'My Weekly Split',
        is_active: true,
        schedule_days_per_week: activeDays.length,
        days: splitDays.map((d, dIdx) => ({
          day_name: d.day_name,
          sort_order: dIdx,
          exercises: d.is_rest
            ? []
            : d.exercises.map((ex, eIdx) => ({
                exercise_name: ex.name,
                target_sets: Number(ex.target_sets) || 3,
                target_reps: String(ex.target_reps || '8-12'),
                rest_seconds: Number(ex.rest_seconds) || 90,
                sort_order: eIdx,
              })),
        })),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Split Activated!', 'Your weekly workout split has been saved and activated.', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add exercise to current working list
  const handleSelectExercise = (name: string) => {
    const newItem: ExerciseItem = {
      id: String(Date.now()),
      name,
      target_sets: 3,
      target_reps: '8-12',
      rest_seconds: 90,
    };

    if (activeMode === 'single_day') {
      setSingleDayExercises((prev) => [...prev, newItem]);
    } else if (activeMode === 'full_week' && targetDayIndexForAdd !== null) {
      setSplitDays((prev) => {
        const copy = [...prev];
        copy[targetDayIndexForAdd] = {
          ...copy[targetDayIndexForAdd],
          exercises: [...copy[targetDayIndexForAdd].exercises, newItem],
        };
        return copy;
      });
    }

    setIsExercisePickerOpen(false);
    setSearchQuery('');
    Haptics.selectionAsync();
  };

  const filteredExercises = exerciseDb.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenContainer scrollable={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="CaretLeft" size={24} color={COLORS.dark.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text variant="h2" style={styles.headerTitle}>
            Workout Plan Builder
          </Text>
          <Text variant="caption" style={styles.headerSubtitle}>
            Custom Routines & Gemini 2.5 Flash Ingestion
          </Text>
        </View>
      </View>

      {/* Mode Switcher Tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'single_day' && styles.modeTabActive]}
          onPress={() => {
            setActiveMode('single_day');
            Haptics.selectionAsync();
          }}
        >
          <Icon
            name="Calendar"
            size={16}
            color={activeMode === 'single_day' ? COLORS.dark.accentRed : COLORS.dark.textSecondary}
          />
          <Text
            variant="caption"
            style={[styles.modeTabText, activeMode === 'single_day' && styles.modeTabTextActive]}
          >
            Single Day
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'full_week' && styles.modeTabActive]}
          onPress={() => {
            setActiveMode('full_week');
            Haptics.selectionAsync();
          }}
        >
          <Icon
            name="CalendarCheck"
            size={16}
            color={activeMode === 'full_week' ? COLORS.dark.accentRed : COLORS.dark.textSecondary}
          />
          <Text
            variant="caption"
            style={[styles.modeTabText, activeMode === 'full_week' && styles.modeTabTextActive]}
          >
            Full Week Split
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'ai_import' && styles.modeTabActive]}
          onPress={() => {
            setActiveMode('ai_import');
            Haptics.selectionAsync();
          }}
        >
          <Icon
            name="Sparkle"
            size={16}
            color={activeMode === 'ai_import' ? COLORS.dark.aiPurple : COLORS.dark.textSecondary}
          />
          <Text
            variant="caption"
            style={[
              styles.modeTabText,
              activeMode === 'ai_import' && { color: COLORS.dark.aiPurple, fontWeight: '700' },
            ]}
          >
            AI Doc / Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= MODE 1: SINGLE DAY RECURRING ================= */}
        {activeMode === 'single_day' && (
          <View style={styles.sectionContainer}>
            <GlassCard style={styles.card}>
              <Badge label="OPTION 1 • WEEKLY RECURRING DAY" variant="red" />
              <Text variant="h3" style={styles.cardHeading}>
                Configure Single Day Plan
              </Text>
              <Text variant="caption" style={styles.cardSubtext}>
                Select the exercises you want to do on a specific day, and it will repeat every week on that day.
              </Text>

              {/* Day of Week Selector */}
              <Text variant="bodySmall" style={styles.fieldLabel}>
                Day of Week
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDayOfWeek === day;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayChip, isSelected && styles.dayChipActive]}
                      onPress={() => {
                        setSelectedDayOfWeek(day);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        variant="caption"
                        style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}
                      >
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Focus / Name */}
              <Text variant="bodySmall" style={styles.fieldLabel}>
                Day Focus / Name
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Chest & Triceps (Push)"
                placeholderTextColor={COLORS.dark.textSecondary}
                value={singleDayFocus}
                onChangeText={setSingleDayFocus}
              />

              {/* Repeat Weekly Toggle */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySmall" style={{ color: COLORS.dark.textPrimary, fontWeight: '600' }}>
                    Repeat Every Week on {selectedDayOfWeek}
                  </Text>
                  <Text variant="caption" style={{ color: COLORS.dark.textSecondary }}>
                    Automatically sets this workout as your routine for every {selectedDayOfWeek}
                  </Text>
                </View>
                <Switch
                  value={repeatWeekly}
                  onValueChange={setRepeatWeekly}
                  trackColor={{ false: '#333', true: COLORS.dark.accentRed }}
                  thumbColor="#FFF"
                />
              </View>
            </GlassCard>

            {/* Exercise List */}
            <View style={styles.exerciseSectionHeader}>
              <Text variant="h3" style={styles.sectionTitle}>
                Exercises ({singleDayExercises.length})
              </Text>
              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={() => {
                  setTargetDayIndexForAdd(null);
                  setIsExercisePickerOpen(true);
                }}
              >
                <Icon name="Plus" size={16} color="#FFF" />
                <Text variant="caption" style={{ color: '#FFF', fontWeight: '700', marginLeft: 4 }}>
                  Add Exercise
                </Text>
              </TouchableOpacity>
            </View>

            {singleDayExercises.map((ex, idx) => (
              <GlassCard key={ex.id || idx} style={styles.exerciseCard}>
                <View style={styles.exerciseRow}>
                  <View style={styles.exerciseIndexBadge}>
                    <Text variant="caption" style={{ color: COLORS.dark.textSecondary, fontWeight: '700' }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text variant="body" style={styles.exerciseName}>
                      {ex.name}
                    </Text>
                    <View style={styles.paramRow}>
                      <View style={styles.paramBox}>
                        <Text variant="caption" style={styles.paramLabel}>
                          Sets
                        </Text>
                        <TextInput
                          style={styles.paramInput}
                          keyboardType="numeric"
                          value={String(ex.target_sets)}
                          onChangeText={(val) => {
                            const updated = [...singleDayExercises];
                            updated[idx].target_sets = Number(val) || 1;
                            setSingleDayExercises(updated);
                          }}
                        />
                      </View>
                      <View style={styles.paramBox}>
                        <Text variant="caption" style={styles.paramLabel}>
                          Reps
                        </Text>
                        <TextInput
                          style={styles.paramInput}
                          value={ex.target_reps}
                          onChangeText={(val) => {
                            const updated = [...singleDayExercises];
                            updated[idx].target_reps = val;
                            setSingleDayExercises(updated);
                          }}
                        />
                      </View>
                      <View style={styles.paramBox}>
                        <Text variant="caption" style={styles.paramLabel}>
                          Rest (s)
                        </Text>
                        <TextInput
                          style={styles.paramInput}
                          keyboardType="numeric"
                          value={String(ex.rest_seconds)}
                          onChangeText={(val) => {
                            const updated = [...singleDayExercises];
                            updated[idx].rest_seconds = Number(val) || 60;
                            setSingleDayExercises(updated);
                          }}
                        />
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      setSingleDayExercises(singleDayExercises.filter((_, i) => i !== idx));
                      Haptics.selectionAsync();
                    }}
                  >
                    <Icon name="Trash" size={18} color={COLORS.dark.accentRed} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}

            <View style={{ marginTop: SPACING.lg, marginBottom: SPACING.xl * 1.5 }}>
              <GradientButton
                title={loading ? 'Saving Day Plan...' : `Save & Repeat on ${selectedDayOfWeek}s`}
                icon={<Icon name="CheckCircle" size={18} color="#FFF" />}
                onPress={handleSaveSingleDay}
                disabled={loading}
              />
            </View>
          </View>
        )}

        {/* ================= MODE 2: FULL WEEK SPLIT ================= */}
        {activeMode === 'full_week' && (
          <View style={styles.sectionContainer}>
            <GlassCard style={styles.card}>
              <Badge label="OPTION 2 • COMPLETE WEEK SCHEDULE" variant="gold" />
              <Text variant="h3" style={styles.cardHeading}>
                Design Your Weekly Split
              </Text>
              <Text variant="caption" style={styles.cardSubtext}>
                Set up Monday through Sunday all at once with full exercise targets, volume, and rest days.
              </Text>

              <Text variant="bodySmall" style={styles.fieldLabel}>
                Program Name
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 4-Day Push Pull Legs Upper Split"
                placeholderTextColor={COLORS.dark.textSecondary}
                value={fullProgramName}
                onChangeText={setFullProgramName}
              />
            </GlassCard>

            {/* Split Day Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
              {splitDays.map((d, index) => {
                const isSelected = selectedSplitDayIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayChip, isSelected && styles.dayChipActive]}
                    onPress={() => {
                      setSelectedSplitDayIndex(index);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text
                      variant="caption"
                      style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}
                    >
                      {DAYS_OF_WEEK[index].slice(0, 3)}
                    </Text>
                    {d.is_rest ? (
                      <Text style={{ fontSize: 10, color: COLORS.dark.textSecondary }}>Rest</Text>
                    ) : (
                      <Text style={{ fontSize: 10, color: COLORS.dark.success }}>{d.exercises.length} Ex</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selected Split Day Details */}
            {(() => {
              const currentDay = splitDays[selectedSplitDayIndex];
              return (
                <GlassCard style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text variant="h3" style={{ color: COLORS.dark.textPrimary, flex: 1 }}>
                      {DAYS_OF_WEEK[selectedSplitDayIndex]}
                    </Text>
                    <View style={styles.restToggle}>
                      <Text variant="caption" style={{ color: COLORS.dark.textSecondary, marginRight: 8 }}>
                        Rest Day
                      </Text>
                      <Switch
                        value={currentDay.is_rest}
                        onValueChange={(val) => {
                          setSplitDays((prev) => {
                            const copy = [...prev];
                            copy[selectedSplitDayIndex] = { ...copy[selectedSplitDayIndex], is_rest: val };
                            return copy;
                          });
                        }}
                        trackColor={{ false: '#333', true: COLORS.dark.accentGold }}
                        thumbColor="#FFF"
                      />
                    </View>
                  </View>

                  {!currentDay.is_rest && (
                    <>
                      <Text variant="bodySmall" style={styles.fieldLabel}>
                        Workout Day Title / Focus
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Upper Body A"
                        placeholderTextColor={COLORS.dark.textSecondary}
                        value={currentDay.day_name}
                        onChangeText={(val) => {
                          setSplitDays((prev) => {
                            const copy = [...prev];
                            copy[selectedSplitDayIndex] = { ...copy[selectedSplitDayIndex], day_name: val };
                            return copy;
                          });
                        }}
                      />

                      <View style={styles.exerciseSectionHeader}>
                        <Text variant="bodySmall" style={{ color: COLORS.dark.textPrimary, fontWeight: '700' }}>
                          Exercises ({currentDay.exercises.length})
                        </Text>
                        <TouchableOpacity
                          style={styles.addExerciseBtnSmall}
                          onPress={() => {
                            setTargetDayIndexForAdd(selectedSplitDayIndex);
                            setIsExercisePickerOpen(true);
                          }}
                        >
                          <Icon name="Plus" size={14} color="#FFF" />
                          <Text variant="caption" style={{ color: '#FFF', fontWeight: '700', marginLeft: 4 }}>
                            Add
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {currentDay.exercises.map((ex, exIdx) => (
                        <View key={ex.id || exIdx} style={styles.splitExerciseRow}>
                          <View style={{ flex: 1 }}>
                            <Text variant="bodySmall" style={{ color: COLORS.dark.textPrimary, fontWeight: '600' }}>
                              {ex.name}
                            </Text>
                            <Text variant="caption" style={{ color: COLORS.dark.textSecondary }}>
                              {ex.target_sets} sets • {ex.target_reps} reps • {ex.rest_seconds}s rest
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setSplitDays((prev) => {
                                const copy = [...prev];
                                copy[selectedSplitDayIndex] = {
                                  ...copy[selectedSplitDayIndex],
                                  exercises: copy[selectedSplitDayIndex].exercises.filter((_, i) => i !== exIdx),
                                };
                                return copy;
                              });
                            }}
                          >
                            <Icon name="Trash" size={16} color={COLORS.dark.accentRed} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}
                </GlassCard>
              );
            })()}

            <View style={{ marginTop: SPACING.lg, marginBottom: SPACING.xl * 1.5 }}>
              <GradientButton
                title={loading ? 'Saving Weekly Split...' : 'Save & Activate Full Week Split'}
                icon={<Icon name="CheckCircle" size={18} color="#FFF" />}
                onPress={handleSaveFullSplit}
                disabled={loading}
              />
            </View>
          </View>
        )}

        {/* ================= MODE 3: AI DOC / SCREENSHOT INGESTION ================= */}
        {activeMode === 'ai_import' && (
          <View style={styles.sectionContainer}>
            <GlassCard style={styles.card}>
              <Badge label="GEMINI 2.5 FLASH • MULTIMODAL INGESTION" variant="gold" />
              <Text variant="h3" style={styles.cardHeading}>
                AI Workout Plan Ingestion
              </Text>
              <Text variant="caption" style={styles.cardSubtext}>
                Got a workout routine in a Google Doc, Apple Notes, or a screenshot/photo of a workout sheet? Feed it to IronLog AI and it will automatically generate your structured plan!
              </Text>

              {/* Input Type Selector */}
              <View style={styles.aiToggleWrap}>
                <TouchableOpacity
                  style={[styles.aiToggleBtn, aiInputType === 'text' && styles.aiToggleBtnActive]}
                  onPress={() => setAiInputType('text')}
                >
                  <Icon name="PencilSimple" size={16} color={aiInputType === 'text' ? '#FFF' : COLORS.dark.textSecondary} />
                  <Text variant="caption" style={[styles.aiToggleText, aiInputType === 'text' && styles.aiToggleTextActive]}>
                    Paste Notes / Doc
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.aiToggleBtn, aiInputType === 'image' && styles.aiToggleBtnActive]}
                  onPress={() => setAiInputType('image')}
                >
                  <Icon name="Sparkle" size={16} color={aiInputType === 'image' ? '#FFF' : COLORS.dark.textSecondary} />
                  <Text variant="caption" style={[styles.aiToggleText, aiInputType === 'image' && styles.aiToggleTextActive]}>
                    Upload Screenshot
                  </Text>
                </TouchableOpacity>
              </View>

              {aiInputType === 'text' ? (
                <View style={{ marginTop: SPACING.md }}>
                  <Text variant="bodySmall" style={styles.fieldLabel}>
                    Workout Document / Notes Text
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={7}
                    maxLength={20000}
                    placeholder={`Paste routine here, e.g.:\nDay 1: Chest & Triceps\n- Flat Bench Press 4x8\n- Incline DB Press 3x10\n- Tricep Pushdown 3x12\n\nDay 2: Back & Biceps\n- Lat Pulldowns 4x10\n- Seated Rows 3x12...`}
                    placeholderTextColor={COLORS.dark.textSecondary}
                    value={aiRoutineText}
                    onChangeText={setAiRoutineText}
                  />
                </View>
              ) : (
                <View style={{ marginTop: SPACING.md }}>
                  <Text variant="bodySmall" style={styles.fieldLabel}>
                    Workout Sheet Screenshot or Photo
                  </Text>
                  {aiSelectedImage ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image source={{ uri: aiSelectedImage.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.repickBtn}
                        onPress={handlePickImage}
                      >
                        <Icon name="ArrowClockwise" size={16} color="#FFF" />
                        <Text variant="caption" style={{ color: '#FFF', marginLeft: 6 }}>
                          Change Photo
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
                      <Icon name="Sparkle" size={32} color={COLORS.dark.aiPurple} />
                      <Text variant="body" style={{ color: COLORS.dark.textPrimary, marginTop: 8 }}>
                        Tap to Select Workout Screenshot
                      </Text>
                      <Text variant="caption" style={{ color: COLORS.dark.textSecondary, marginTop: 4 }}>
                        Supports camera roll photos, spreadsheets, or whiteboard shots
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={{ marginTop: SPACING.lg }}>
                <GradientButton
                  title={aiParsing ? 'Gemini 2.5 Flash is Parsing...' : 'Parse & Extract Plan with AI'}
                  icon={<Icon name="Sparkle" size={18} color="#FFF" />}
                  onPress={handleRunAiParsing}
                  disabled={aiParsing}
                />
              </View>
            </GlassCard>

            {/* AI Extracted Result Preview */}
            {aiParsedResult && (
              <GlassCard style={[styles.card, { borderColor: COLORS.dark.aiPurple, borderWidth: 1 }]}>
                <Badge label="PARSED ROUTINE PREVIEW" variant="gold" />
                <Text variant="h2" style={{ color: COLORS.dark.textPrimary, marginTop: 8 }}>
                  {aiParsedResult.program_name}
                </Text>
                <Text variant="caption" style={{ color: COLORS.dark.textSecondary, marginTop: 2 }}>
                  {aiParsedResult.description || 'Custom multi-day routine extracted by Gemini.'}
                </Text>

                <View style={{ marginTop: SPACING.md }}>
                  {aiParsedResult.days?.map((day: any, dIdx: number) => (
                    <View key={dIdx} style={styles.parsedDayCard}>
                      <Text variant="body" style={{ color: COLORS.dark.accentGold, fontWeight: '700' }}>
                        {day.day_name}
                      </Text>
                      {day.exercises?.map((ex: any, eIdx: number) => (
                        <View key={eIdx} style={styles.parsedExItem}>
                          <Text variant="bodySmall" style={{ color: COLORS.dark.textPrimary }}>
                            • {ex.name}
                          </Text>
                          <Text variant="caption" style={{ color: COLORS.dark.textSecondary }}>
                            {ex.target_sets} sets × {ex.target_reps} reps ({ex.rest_seconds || 90}s rest)
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: SPACING.lg }}>
                  <GradientButton
                    title={loading ? 'Applying Plan...' : 'Save & Set as My Active Workout'}
                    icon={<Icon name="CheckCircle" size={18} color="#FFF" />}
                    onPress={handleApplyAiPlan}
                    disabled={loading}
                  />
                </View>
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={isExercisePickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h3" style={{ color: COLORS.dark.textPrimary }}>
                Select Exercise
              </Text>
              <TouchableOpacity onPress={() => setIsExercisePickerOpen(false)}>
                <Icon name="X" size={24} color={COLORS.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search or enter custom exercise..."
              placeholderTextColor={COLORS.dark.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {searchQuery.trim().length > 0 &&
              !filteredExercises.some((e) => e.name.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                <TouchableOpacity
                  style={styles.customExercisePrompt}
                  onPress={() => handleSelectExercise(searchQuery.trim())}
                >
                  <Icon name="Plus" size={16} color={COLORS.dark.accentGold} />
                  <Text variant="bodySmall" style={{ color: COLORS.dark.accentGold, marginLeft: 8 }}>
                    Create custom: "{searchQuery.trim()}"
                  </Text>
                </TouchableOpacity>
              )}

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredExercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.exercisePickerItem}
                  onPress={() => handleSelectExercise(ex.name)}
                >
                  <View>
                    <Text variant="body" style={{ color: COLORS.dark.textPrimary }}>
                      {ex.name}
                    </Text>
                    <Text variant="caption" style={{ color: COLORS.dark.textSecondary }}>
                      {ex.primary_muscle}
                    </Text>
                  </View>
                  <Icon name="CaretRight" size={16} color={COLORS.dark.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.dark.textPrimary,
  },
  headerSubtitle: {
    color: COLORS.dark.textSecondary,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    padding: 4,
    marginTop: SPACING.xs,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  modeTabActive: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
  },
  modeTabText: {
    color: COLORS.dark.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: COLORS.dark.accentRed,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  sectionContainer: {
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  cardHeading: {
    color: COLORS.dark.textPrimary,
    marginTop: SPACING.xs,
  },
  cardSubtext: {
    color: COLORS.dark.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  daysScroll: {
    marginVertical: SPACING.xs,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: COLORS.dark.accentRed,
  },
  dayChipText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.md,
    color: COLORS.dark.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.md,
    color: COLORS.dark.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.dark.textPrimary,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.accentRed,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  addExerciseBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  exerciseCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  paramRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  paramBox: {
    alignItems: 'center',
  },
  paramLabel: {
    color: COLORS.dark.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },
  paramInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.sm,
    color: COLORS.dark.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    textAlign: 'center',
    minWidth: 46,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  aiToggleWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    padding: 3,
    marginTop: SPACING.md,
  },
  aiToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  aiToggleBtnActive: {
    backgroundColor: COLORS.dark.aiPurple,
  },
  aiToggleText: {
    color: COLORS.dark.textSecondary,
    marginLeft: 6,
  },
  aiToggleTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  imagePreviewWrap: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.md,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  repickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  parsedDayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: 8,
  },
  parsedExItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalSearchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    color: COLORS.dark.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: SPACING.sm,
  },
  customExercisePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  exercisePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
});

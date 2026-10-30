import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  Image,
  Switch,
  Platform,
  PanResponder,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
import { api, getCachedExercises } from '@/services/api';

type BuilderMode = 'split' | 'ai_import';

interface ScrapedStep {
  step: number;
  name?: string;
  text: string;
}

interface EnrichedExercise {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles?: string | string[];
  equipment?: string;
  difficulty?: string;
  category?: string;
  mechanics?: string;
  force?: string;
  movement_pattern?: string;
  steps?: ScrapedStep[];
  instructions?: string;
  coaching_cues?: string[];
  common_mistakes?: string[];
  full_description?: string;
  thumbnail_url?: string;
  source_url?: string;
  primary_muscles_detailed?: string[];
  secondary_muscles_detailed?: string[];
}

interface ExerciseItem {
  id: string;
  exercise_id?: string;
  name: string;
  target_sets: number;
  target_reps: string;
  rest_seconds: number;
  categoryTag?: string;
  muscleTarget?: string;
  equipment?: string;
}

const MUSCLE_CATEGORIES = [
  { id: 'chest', name: 'Chest', focus: 'Pectorals, Presses, Flyes', icon: 'Flame' as const, color: OBSIDIAN_COLORS.voltLime },
  { id: 'back', name: 'Back', focus: 'Lats, Rhomboids, Traps, Rows', icon: 'Lightning' as const, color: OBSIDIAN_COLORS.cyanAccent },
  { id: 'shoulders', name: 'Shoulders', focus: 'Deltoids, Overhead, Raises', icon: 'ArrowFatUp' as const, color: OBSIDIAN_COLORS.secondary },
  { id: 'biceps', name: 'Biceps', focus: 'Curls, Brachialis, Long Head', icon: 'Barbell' as const, color: OBSIDIAN_COLORS.voltLime },
  { id: 'triceps', name: 'Triceps', focus: 'Pushdowns, Extensions, Dips', icon: 'Lightning' as const, color: OBSIDIAN_COLORS.cyanAccent },
  { id: 'forearms', name: 'Forearms', focus: 'Wrist Curls, Grippers, Holds', icon: 'CheckCircle' as const, color: OBSIDIAN_COLORS.secondary },
  { id: 'quads', name: 'Quads & Legs', focus: 'Squats, Leg Press, Extensions', icon: 'Barbell' as const, color: OBSIDIAN_COLORS.voltLime },
  { id: 'hamstrings', name: 'Hamstrings', focus: 'Deadlifts, Curls, RDLs', icon: 'Barbell' as const, color: OBSIDIAN_COLORS.cyanAccent },
  { id: 'glutes', name: 'Glutes', focus: 'Hip Thrusts, Bridges, Kickbacks', icon: 'Flame' as const, color: OBSIDIAN_COLORS.secondary },
  { id: 'calves', name: 'Calves', focus: 'Standing & Seated Calf Raises', icon: 'ArrowFatUp' as const, color: OBSIDIAN_COLORS.textMuted },
  { id: 'core', name: 'Core & Abs', focus: 'Crunches, Leg Raises, Planks', icon: 'Sparkle' as const, color: OBSIDIAN_COLORS.voltLime },
  { id: 'all', name: 'All Exercises', focus: 'Browse full database', icon: 'MagnifyingGlass' as const, color: OBSIDIAN_COLORS.textWhite },
];

interface SplitDay {
  day_code: string;
  day_name: string;
  focus_title: string;
  is_rest: boolean;
  exercises: ExerciseItem[];
}

const DAYS_OF_WEEK = [
  { code: 'MON', name: 'Monday' },
  { code: 'TUE', name: 'Tuesday' },
  { code: 'WED', name: 'Wednesday' },
  { code: 'THU', name: 'Thursday' },
  { code: 'FRI', name: 'Friday' },
  { code: 'SAT', name: 'Saturday' },
  { code: 'SUN', name: 'Sunday' },
];

function mapWorkoutDaysToSplitDays(workoutDays: any[]): SplitDay[] {
  const result: SplitDay[] = DAYS_OF_WEEK.map((template) => ({
    day_code: template.code,
    day_name: template.name,
    focus_title: 'Rest & Recovery',
    is_rest: true,
    exercises: [],
  }));

  const mapExercises = (dbExercises: any[]): ExerciseItem[] => {
    if (!Array.isArray(dbExercises)) return [];
    return dbExercises.map((e, idx) => ({
      id: e.id || `ex-${idx}-${Date.now()}`,
      exercise_id: e.exercise_id || e.exercise?.id,
      name: e.exercise?.name || e.exercise_name || `Exercise ${idx + 1}`,
      target_sets: Number(e.target_sets) || 3,
      target_reps: String(e.target_reps || '8 - 10'),
      rest_seconds: Number(e.rest_seconds) || 90,
      categoryTag: e.exercise?.primary_muscle ? 'HYPERTROPHY' : 'PRIMARY HEAVY',
      muscleTarget: e.exercise?.primary_muscle || 'Full Body',
      equipment: e.exercise?.equipment || '',
    }));
  };

  const extractFocus = (dayName: string, weekdayName: string): string => {
    if (!dayName) return 'Workout';
    if (dayName.includes(' - ')) {
      const parts = dayName.split(' - ');
      return parts.slice(1).join(' - ').trim();
    }
    const stripped = dayName.replace(new RegExp(weekdayName, 'gi'), '').trim();
    return stripped.replace(/^[:-]\s*/, '').trim() || 'Workout';
  };

  let matchedAny = false;
  workoutDays.forEach((wd) => {
    const rawName = (wd.day_name || '').toLowerCase();
    const dayIndex = DAYS_OF_WEEK.findIndex((d) => rawName.includes(d.name.toLowerCase()));
    if (dayIndex !== -1) {
      matchedAny = true;
      const exList = mapExercises(wd.exercises);
      const isRest = exList.length === 0 || rawName.includes('rest');
      result[dayIndex] = {
        day_code: DAYS_OF_WEEK[dayIndex].code,
        day_name: DAYS_OF_WEEK[dayIndex].name,
        focus_title: isRest ? 'Rest & Recovery' : extractFocus(wd.day_name, DAYS_OF_WEEK[dayIndex].name),
        is_rest: isRest,
        exercises: exList,
      };
    }
  });

  if (!matchedAny) {
    workoutDays.forEach((wd, idx) => {
      const targetIdx = wd.sort_order !== undefined && wd.sort_order >= 0 && wd.sort_order < 7 ? wd.sort_order : idx < 7 ? idx : -1;
      if (targetIdx >= 0 && targetIdx < 7) {
        const exList = mapExercises(wd.exercises);
        const isRest = exList.length === 0 || (wd.day_name || '').toLowerCase().includes('rest');
        result[targetIdx] = {
          day_code: DAYS_OF_WEEK[targetIdx].code,
          day_name: DAYS_OF_WEEK[targetIdx].name,
          focus_title: isRest ? 'Rest & Recovery' : wd.day_name || `Day ${targetIdx + 1}`,
          is_rest: isRest,
          exercises: exList,
        };
      }
    });
  }

  return result;
}

const INITIAL_SPLIT_DAYS: SplitDay[] = [
  {
    day_code: 'MON',
    day_name: 'Monday',
    focus_title: 'Upper A',
    is_rest: false,
    exercises: [
      {
        id: 'f-1',
        name: 'Barbell Bench Press',
        target_sets: 4,
        target_reps: '8 - 10',
        rest_seconds: 120,
        categoryTag: 'PRIMARY HEAVY',
        muscleTarget: 'Chest & Triceps',
      },
      {
        id: 'f-2',
        name: 'Incline Dumbbell Press',
        target_sets: 3,
        target_reps: '10 - 12',
        rest_seconds: 90,
        categoryTag: 'HYPERTROPHY',
        muscleTarget: 'Upper Clavicular',
      },
      {
        id: 'f-3',
        name: 'Overhead Cable Extension',
        target_sets: 3,
        target_reps: '12 - 15',
        rest_seconds: 60,
        categoryTag: 'ISOLATION',
        muscleTarget: 'Triceps Long Head',
      },
    ],
  },
  {
    day_code: 'TUE',
    day_name: 'Tuesday',
    focus_title: 'Lower A',
    is_rest: false,
    exercises: [
      {
        id: 'f-4',
        name: 'Barbell Squats',
        target_sets: 4,
        target_reps: '8 - 10',
        rest_seconds: 120,
        categoryTag: 'PRIMARY HEAVY',
        muscleTarget: 'Quadriceps & Glutes',
      },
      {
        id: 'f-5',
        name: 'Romanian Deadlifts',
        target_sets: 3,
        target_reps: '10 - 12',
        rest_seconds: 90,
        categoryTag: 'HYPERTROPHY',
        muscleTarget: 'Hamstrings',
      },
    ],
  },
  {
    day_code: 'WED',
    day_name: 'Wednesday',
    focus_title: 'Rest & Recovery',
    is_rest: true,
    exercises: [],
  },
  {
    day_code: 'THU',
    day_name: 'Thursday',
    focus_title: 'Upper B',
    is_rest: false,
    exercises: [
      {
        id: 'f-6',
        name: 'Overhead Shoulder Press',
        target_sets: 4,
        target_reps: '8 - 10',
        rest_seconds: 120,
        categoryTag: 'PRIMARY HEAVY',
        muscleTarget: 'Anterior Deltoids',
      },
      {
        id: 'f-7',
        name: 'Lat Pulldown',
        target_sets: 4,
        target_reps: '10 - 12',
        rest_seconds: 90,
        categoryTag: 'HYPERTROPHY',
        muscleTarget: 'Latissimus Dorsi',
      },
    ],
  },
  {
    day_code: 'FRI',
    day_name: 'Friday',
    focus_title: 'Lower B',
    is_rest: false,
    exercises: [
      {
        id: 'f-8',
        name: 'Leg Press',
        target_sets: 4,
        target_reps: '10 - 12',
        rest_seconds: 90,
        categoryTag: 'HYPERTROPHY',
        muscleTarget: 'Quadriceps',
      },
      {
        id: 'f-9',
        name: 'Calf Raises',
        target_sets: 4,
        target_reps: '15 - 20',
        rest_seconds: 45,
        categoryTag: 'ISOLATION',
        muscleTarget: 'Gastrocnemius',
      },
    ],
  },
  {
    day_code: 'SAT',
    day_name: 'Saturday',
    focus_title: 'Rest & Mobility',
    is_rest: true,
    exercises: [],
  },
  {
    day_code: 'SUN',
    day_name: 'Sunday',
    focus_title: 'Rest & Recovery',
    is_rest: true,
    exercises: [],
  },
];

export default function WorkoutPlanBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayIndex?: string; dayName?: string }>();
  const [activeMode, setActiveMode] = useState<BuilderMode>('split');
  const [loading, setLoading] = useState(false);

  // Initial day index based on params or today's weekday (Mon=0..Sun=6)
  const getInitialDayIndex = (): number => {
    if (params.dayIndex !== undefined) {
      const idx = parseInt(params.dayIndex, 10);
      if (!isNaN(idx) && idx >= 0 && idx < 7) {
        return idx;
      }
    }
    return (new Date().getDay() + 6) % 7;
  };

  // Program details
  const [programName, setProgramName] = useState('Hypertrophy 4-Day Split');
  const [splitDays, setSplitDays] = useState<SplitDay[]>(INITIAL_SPLIT_DAYS);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(getInitialDayIndex);

  // Exercise Picker & Details State
  const [exerciseDb, setExerciseDb] = useState<EnrichedExercise[]>([]);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<'categories' | 'exercises'>('categories');
  const [selectedMuscleCategory, setSelectedMuscleCategory] = useState<string | null>(null);
  const [selectedInfoExercise, setSelectedInfoExercise] = useState<EnrichedExercise | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Exercise Reorder State & Gesture Handling
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const panY = useRef(new Animated.Value(0)).current;
  const cardHeights = useRef<{ [key: number]: number }>({});
  const dragRef = useRef({
    startIndex: 0,
    targetIndex: 0,
    isDragging: false,
  });
  const panRespondersRef = useRef<Map<number, ReturnType<typeof PanResponder.create>>>(new Map());

interface ParsedPlanExercise {
  name: string;
  target_sets?: number;
  target_reps?: string;
  rest_seconds?: number;
}

interface ParsedPlanDay {
  day_name: string;
  exercises: ParsedPlanExercise[];
}

interface ParsedPlanResult {
  program_name?: string;
  difficulty?: string;
  schedule_days_per_week?: number;
  description?: string;
  days: ParsedPlanDay[];
}

  // AI Routine Parser State
  const [aiInputType, setAiInputType] = useState<'text' | 'image'>('text');
  const [aiRoutineText, setAiRoutineText] = useState('');
  const [aiSelectedImage, setAiSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [aiParsedResult, setAiParsedResult] = useState<ParsedPlanResult | null>(null);
  const [aiParsing, setAiParsing] = useState(false);

  // Fetch backend exercise library
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await getCachedExercises();
        if (Array.isArray(data)) {
          setExerciseDb(data);
        }
      } catch (err) {
        console.warn('Could not fetch exercise database:', err);
      }
    };
    fetchExercises();
  }, []);

  // Fetch active workout program from backend
  useEffect(() => {
    let isMounted = true;
    const fetchActiveProgram = async () => {
      try {
        const res = await api.get('/programs/active').catch(() => null);
        if (!isMounted || !res?.data) return;
        const prog = res.data;
        if (prog.name) {
          setProgramName(prog.name);
        }
        if (Array.isArray(prog.workoutDays) && prog.workoutDays.length > 0) {
          const mappedSplit = mapWorkoutDaysToSplitDays(prog.workoutDays);
          setSplitDays(mappedSplit);

          // Select requested day if passed, otherwise default to today
          if (params.dayIndex !== undefined) {
            const idx = parseInt(params.dayIndex, 10);
            if (!isNaN(idx) && idx >= 0 && idx < 7) {
              setSelectedDayIndex(idx);
            }
          } else if (params.dayName) {
            const matchIdx = mappedSplit.findIndex(
              (d) =>
                d.day_name.toLowerCase().includes(params.dayName!.toLowerCase()) ||
                d.focus_title.toLowerCase().includes(params.dayName!.toLowerCase())
            );
            if (matchIdx !== -1) {
              setSelectedDayIndex(matchIdx);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch active program in builder:', err);
      }
    };
    fetchActiveProgram();
    return () => {
      isMounted = false;
    };
  }, [params.dayIndex, params.dayName]);

  // Pick Image for AI parsing
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
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not select image';
      Alert.alert('Error', message);
    }
  };

  // Run AI Parsing (F5: maxLength 20,000 preserved)
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
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      const payload: { text?: string; imageBase64?: string; mimeType?: string } = {};
      if (aiInputType === 'text') {
        payload.text = aiRoutineText.slice(0, 20000); // Strict F5 character safety
      } else {
        payload.imageBase64 = aiSelectedImage?.base64 || undefined;
        payload.mimeType = aiSelectedImage?.mimeType || 'image/jpeg';
      }

      const res = await api.post('/ai/parse-plan', payload);
      if (res.data?.program) {
        setAiParsedResult(res.data.program);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } else {
        throw new Error('AI could not extract routine');
      }
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      Alert.alert('AI Parsing Failed', axiosErr?.response?.data?.error || axiosErr?.message || 'Error parsing workout');
    } finally {
      setAiParsing(false);
    }
  };

  // Apply parsed AI plan to active split
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
        days: aiParsedResult.days.map((d: ParsedPlanDay, idx: number) => ({
          day_name: d.day_name,
          sort_order: idx,
          exercises: d.exercises.map((ex: ParsedPlanExercise, eIdx: number) => ({
            exercise_name: ex.name,
            target_sets: ex.target_sets || 3,
            target_reps: String(ex.target_reps || '8-12'),
            rest_seconds: ex.rest_seconds || 90,
            sort_order: eIdx,
          })),
        })),
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      Alert.alert('Plan Applied!', 'Your AI-parsed workout plan is now active.', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      Alert.alert('Save Failed', axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  // Save Split Plan
  const handleSavePlan = async () => {
    const activeDays = splitDays.filter((d) => !d.is_rest);
    if (activeDays.length === 0) {
      Alert.alert('Empty Split', 'Please configure at least one active workout day in your split.');
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      await api.post('/programs/full', {
        name: programName.trim() || 'My Weekly Split',
        is_active: true,
        schedule_days_per_week: activeDays.length,
        days: splitDays.map((d, dIdx) => ({
          day_name: `${d.day_name} - ${d.focus_title}`,
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

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      Alert.alert('Plan Saved!', 'Your weekly workout split has been saved and activated.', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      Alert.alert('Save Failed', axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExerciseInfo = (ex: ExerciseItem | EnrichedExercise) => {
    const matched =
      'steps' in ex || 'coaching_cues' in ex
        ? (ex as EnrichedExercise)
        : exerciseDb.find(
            (e) =>
              e.name.toLowerCase().trim() === ex.name.toLowerCase().trim() ||
              ('exercise_id' in ex && ex.exercise_id && e.id === ex.exercise_id)
          );
    if (matched) {
      setSelectedInfoExercise(matched);
    } else {
      setSelectedInfoExercise({
        id: ex.id || 'custom',
        name: ex.name,
        primary_muscle: ('muscleTarget' in ex ? ex.muscleTarget : (ex as EnrichedExercise).primary_muscle) || 'Custom Muscle',
        equipment: ex.equipment || 'Gym',
        category: ('categoryTag' in ex ? ex.categoryTag : (ex as EnrichedExercise).category) || 'Hypertrophy',
      });
    }
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const openExercisePicker = () => {
    setPickerStep('categories');
    setSelectedMuscleCategory(null);
    setSearchQuery('');
    setIsExercisePickerOpen(true);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleSelectExercise = (name: string, primaryMuscle?: string, exerciseId?: string) => {
    const matched = exerciseDb.find((e) => e.name.toLowerCase().trim() === name.toLowerCase().trim());
    const newItem: ExerciseItem = {
      id: String(Date.now()),
      exercise_id: exerciseId || matched?.id,
      name,
      target_sets: 3,
      target_reps: '10 - 12',
      rest_seconds: 90,
      categoryTag: matched?.category || 'HYPERTROPHY',
      muscleTarget: primaryMuscle || matched?.primary_muscle || 'Target Muscle',
      equipment: matched?.equipment || 'Gym',
    };

    setSplitDays((prev) => {
      const copy = [...prev];
      copy[selectedDayIndex] = {
        ...copy[selectedDayIndex],
        exercises: [...copy[selectedDayIndex].exercises, newItem],
      };
      return copy;
    });

    setIsExercisePickerOpen(false);
    setSearchQuery('');
    setPickerStep('categories');
    setSelectedMuscleCategory(null);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleRemoveExercise = (exIdx: number) => {
    setSplitDays((prev) => {
      const copy = [...prev];
      copy[selectedDayIndex] = {
        ...copy[selectedDayIndex],
        exercises: copy[selectedDayIndex].exercises.filter((_, i) => i !== exIdx),
      };
      return copy;
    });
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setSplitDays((prev) => {
      const copy = [...prev];
      const day = { ...copy[selectedDayIndex] };
      const list = [...day.exercises];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
        return prev;
      }
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      day.exercises = list;
      copy[selectedDayIndex] = day;
      return copy;
    });
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const openReorderMenu = (index: number) => {
    const day = splitDays[selectedDayIndex];
    if (!day || day.exercises.length <= 1) return;
    const total = day.exercises.length;
    const exName = day.exercises[index]?.name || 'Exercise';

    Alert.alert(
      'Reorder Exercise',
      `Rearrange "${exName}"`,
      [
        ...(index > 0
          ? [
              {
                text: 'Move Up (▲)',
                onPress: () => handleMoveExercise(index, index - 1),
              },
            ]
          : []),
        ...(index < total - 1
          ? [
              {
                text: 'Move Down (▼)',
                onPress: () => handleMoveExercise(index, index + 1),
              },
            ]
          : []),
        ...(index > 0
          ? [
              {
                text: 'Move to Top',
                onPress: () => handleMoveExercise(index, 0),
              },
            ]
          : []),
        ...(index < total - 1
          ? [
              {
                text: 'Move to Bottom',
                onPress: () => handleMoveExercise(index, total - 1),
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  };

  const latestStateRef = useRef({
    splitDays,
    selectedDayIndex,
    handleMoveExercise,
    openReorderMenu,
  });

  useEffect(() => {
    latestStateRef.current = {
      splitDays,
      selectedDayIndex,
      handleMoveExercise,
      openReorderMenu,
    };
  });

  const getPanResponder = (index: number) => {
    let pr = panRespondersRef.current.get(index);
    if (!pr) {
      pr = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragRef.current = {
            startIndex: index,
            targetIndex: index,
            isDragging: true,
          };
          panY.setValue(0);
          setDraggingIndex(index);
          setDragOverIndex(index);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        },
        onPanResponderMove: (_, g) => {
          panY.setValue(g.dy);
          const start = dragRef.current.startIndex;
          const { splitDays: curSplit, selectedDayIndex: curIdx } = latestStateRef.current;
          const count = curSplit[curIdx]?.exercises.length || 0;
          const cardH = (cardHeights.current[start] || 130) + 10;
          const offset = Math.round(g.dy / cardH);
          const target = Math.max(0, Math.min(count - 1, start + offset));

          if (target !== dragRef.current.targetIndex) {
            dragRef.current.targetIndex = target;
            setDragOverIndex(target);
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync().catch(() => {});
            }
          }
        },
        onPanResponderRelease: (_, g) => {
          const start = dragRef.current.startIndex;
          const target = dragRef.current.targetIndex;
          dragRef.current.isDragging = false;

          const isTap = Math.abs(g.dy) < 5 && Math.abs(g.dx) < 5;

          if (isTap) {
            setDraggingIndex(null);
            setDragOverIndex(null);
            latestStateRef.current.openReorderMenu(start);
            return;
          }

          const { splitDays: curSplit, selectedDayIndex: curIdx } = latestStateRef.current;
          const count = curSplit[curIdx]?.exercises.length || 0;

          if (target !== start && target >= 0 && target < count) {
            latestStateRef.current.handleMoveExercise(start, target);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
          }

          Animated.spring(panY, {
            toValue: 0,
            friction: 6,
            tension: 40,
            useNativeDriver: false,
          }).start(() => {
            setDraggingIndex(null);
            setDragOverIndex(null);
          });
        },
        onPanResponderTerminate: () => {
          dragRef.current.isDragging = false;
          Animated.spring(panY, {
            toValue: 0,
            friction: 6,
            tension: 40,
            useNativeDriver: false,
          }).start(() => {
            setDraggingIndex(null);
            setDragOverIndex(null);
          });
        },
      });
      panRespondersRef.current.set(index, pr);
    }
    return pr;
  };

  const handleUpdateExerciseParam = (
    exIdx: number,
    field: 'target_sets' | 'target_reps' | 'rest_seconds',
    value: number | string
  ) => {
    setSplitDays((prev) => {
      const copy = [...prev];
      const day = { ...copy[selectedDayIndex] };
      const exList = [...day.exercises];
      exList[exIdx] = { ...exList[exIdx], [field]: value };
      day.exercises = exList;
      copy[selectedDayIndex] = day;
      return copy;
    });
  };

  const currentDay = splitDays[selectedDayIndex] || splitDays[0];

  // Helper to count exercises in each muscle category
  const getMuscleExerciseCount = (catId: string, catName: string) => {
    if (catId === 'all') return exerciseDb.length;
    const target = catName.toLowerCase();
    return exerciseDb.filter((e) => {
      const pm = (e.primary_muscle || '').toLowerCase();
      if (target.includes('quad') || target.includes('leg')) return pm.includes('quad') || pm.includes('leg');
      if (target.includes('core') || target.includes('ab')) return pm.includes('core') || pm.includes('ab');
      if (target.includes('back')) return pm.includes('back') || pm.includes('trap');
      if (target.includes('shoulder')) return pm.includes('shoulder') || pm.includes('deltoid');
      if (target.includes('bicep')) return pm.includes('bicep');
      if (target.includes('tricep')) return pm.includes('tricep');
      if (target.includes('forearm')) return pm.includes('forearm');
      if (target.includes('chest')) return pm.includes('chest');
      if (target.includes('hamstring')) return pm.includes('hamstring');
      if (target.includes('glute')) return pm.includes('glute');
      if (target.includes('calf') || target.includes('calve')) return pm.includes('calv') || pm.includes('calf');
      return pm.includes(target);
    }).length;
  };

  // Filtered exercises according to selected muscle category and search text
  const displayedExercises = React.useMemo(() => {
    let list = exerciseDb;
    if (selectedMuscleCategory && selectedMuscleCategory !== 'All Exercises') {
      const target = selectedMuscleCategory.toLowerCase();
      list = exerciseDb.filter((e) => {
        const pm = (e.primary_muscle || '').toLowerCase();
        if (target.includes('quad') || target.includes('leg')) return pm.includes('quad') || pm.includes('leg');
        if (target.includes('core') || target.includes('ab')) return pm.includes('core') || pm.includes('ab');
        if (target.includes('back')) return pm.includes('back') || pm.includes('trap');
        if (target.includes('shoulder')) return pm.includes('shoulder') || pm.includes('deltoid');
        if (target.includes('bicep')) return pm.includes('bicep');
        if (target.includes('tricep')) return pm.includes('tricep');
        if (target.includes('forearm')) return pm.includes('forearm');
        if (target.includes('chest')) return pm.includes('chest');
        if (target.includes('hamstring')) return pm.includes('hamstring');
        if (target.includes('glute')) return pm.includes('glute');
        if (target.includes('calf') || target.includes('calve')) return pm.includes('calv') || pm.includes('calf');
        return pm.includes(target);
      });
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.equipment && e.equipment.toLowerCase().includes(q)) ||
          (e.primary_muscle && e.primary_muscle.toLowerCase().includes(q))
      );
    }

    const seen = new Set<string>();
    return list.filter((e) => {
      const key = e.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [exerciseDb, selectedMuscleCategory, searchQuery]);

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={styles.container}>
        {/* Top Header Row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Icon name="CaretLeft" size={20} color={OBSIDIAN_COLORS.textWhite} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Plan Builder</Text>
              <Text style={styles.headerSubtitle}>{programName || 'Weekly Split'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.importModeBtn,
                activeMode === 'ai_import' && styles.importModeBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => {
                setActiveMode(activeMode === 'split' ? 'ai_import' : 'split');
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync().catch(() => {});
                }
              }}
            >
              <Icon
                name="Sparkle"
                size={15}
                color={activeMode === 'ai_import' ? OBSIDIAN_COLORS.onPrimary : OBSIDIAN_COLORS.voltLime}
              />
              <Text
                style={[
                  styles.importModeText,
                  activeMode === 'ai_import' && { color: OBSIDIAN_COLORS.onPrimary },
                ]}
              >
                {activeMode === 'ai_import' ? 'Back to Split' : 'AI Import'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Main Area */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={draggingIndex === null}
        >
          {activeMode === 'split' ? (
            <>
              {/* Current Program Card */}
              <View style={styles.programCard}>
                <Text style={styles.programLabel}>CURRENT PROGRAM</Text>
                <View style={styles.programNameBox}>
                  <TextInput
                    style={styles.programInput}
                    value={programName}
                    onChangeText={setProgramName}
                    placeholder="Program Name"
                    placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                  />
                  <Icon name="PencilSimple" size={18} color={OBSIDIAN_COLORS.voltLime} />
                </View>
              </View>

              {/* Weekly Schedule Day Strip */}
              <View style={styles.scheduleSection}>
                <View style={styles.scheduleHeaderRow}>
                  <Text style={styles.scheduleLabel}>WEEKLY SCHEDULE</Text>
                  <Text style={styles.scheduleHint}>Tap day to edit</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysScroll}
                >
                  {splitDays.map((d, index) => {
                    const isSelected = selectedDayIndex === index;
                    return (
                      <TouchableOpacity
                        key={d.day_code}
                        style={[
                          styles.dayPill,
                          isSelected && styles.dayPillSelected,
                          d.is_rest && !isSelected && styles.dayPillRest,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedDayIndex(index);
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                        }}
                      >
                        {isSelected && <View style={styles.dayVoltDot} />}
                        <Text
                          style={[
                            styles.dayCodeText,
                            isSelected && { color: OBSIDIAN_COLORS.voltLime },
                          ]}
                        >
                          {d.day_code}
                        </Text>
                        <Text style={styles.dayFocusText} numberOfLines={1}>
                          {d.is_rest ? 'Rest' : d.focus_title}
                        </Text>
                        <View
                          style={[
                            styles.dayExCountBadge,
                            isSelected && { backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayExCountText,
                              isSelected && { color: OBSIDIAN_COLORS.voltLime },
                            ]}
                          >
                            {d.is_rest ? 'Off' : `${d.exercises.length} Ex`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Selected Day Header Card */}
              <View style={styles.selectedDayCard}>
                <View style={styles.selectedDayLeft}>
                  <View style={styles.selectedDayIndicator} />
                  <Text style={styles.selectedDayTitle}>{currentDay.day_name}</Text>
                </View>

                <View style={styles.restToggleContainer}>
                  <Text style={styles.restToggleLabel}>Rest Day</Text>
                  <Switch
                    value={currentDay.is_rest}
                    onValueChange={(val) => {
                      setSplitDays((prev) => {
                        const copy = [...prev];
                        copy[selectedDayIndex] = { ...copy[selectedDayIndex], is_rest: val };
                        return copy;
                      });
                    }}
                    trackColor={{ false: '#272A35', true: OBSIDIAN_COLORS.voltLime }}
                    thumbColor={OBSIDIAN_COLORS.textWhite}
                  />
                </View>
              </View>

              {/* Day Routine Content */}
              {currentDay.is_rest ? (
                <View style={styles.restDayCard}>
                  <Icon name="Moon" size={36} color={OBSIDIAN_COLORS.cyanAccent} />
                  <Text style={styles.restDayTitle}>Scheduled Rest Day</Text>
                  <Text style={styles.restDayBody}>
                    No training prescribed. Focus on hydration, mobility, and muscle recovery.
                  </Text>
                </View>
              ) : (
                <View style={styles.exerciseSection}>
                  <View style={styles.exerciseHeaderRow}>
                    <View style={styles.exerciseCountGroup}>
                      <Text style={styles.exerciseListLabel}>EXERCISES</Text>
                      <View style={styles.exerciseCountChip}>
                        <Text style={styles.exerciseCountChipText}>
                          {currentDay.exercises.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Exercise Cards */}
                  {currentDay.exercises.map((ex, exIdx) => {
                    const isBeingDragged = draggingIndex === exIdx;
                    const isTargetSlot =
                      dragOverIndex === exIdx && draggingIndex !== null && draggingIndex !== exIdx;

                    return (
                      <Animated.View
                        key={ex.id || `${exIdx}-${ex.name}`}
                        onLayout={(e) => {
                          cardHeights.current[exIdx] = e.nativeEvent.layout.height;
                        }}
                        style={[
                          styles.exerciseCard,
                          isBeingDragged && [
                            styles.exerciseCardDragging,
                            {
                              transform: [{ translateY: panY }],
                            },
                          ],
                          isTargetSlot && styles.exerciseCardTargetSlot,
                        ]}
                      >
                        {exIdx === 0 && <View style={styles.exerciseVoltBar} />}

                        {/* Drop indicator bar for target slot */}
                        {isTargetSlot && (
                          <View
                            style={[
                              styles.dropIndicatorLine,
                              draggingIndex !== null && draggingIndex > exIdx
                                ? styles.dropIndicatorTop
                                : styles.dropIndicatorBottom,
                            ]}
                          >
                            <View style={styles.dropIndicatorDot} />
                            <View style={styles.dropIndicatorBar} />
                          </View>
                        )}

                        {/* Floating pill while dragging */}
                        {isBeingDragged && (
                          <View style={styles.dragPill}>
                            <Text style={styles.dragPillText}>
                              Moving to #{dragOverIndex !== null ? dragOverIndex + 1 : exIdx + 1}
                            </Text>
                          </View>
                        )}

                        <View style={styles.exerciseTopRow}>
                          <View style={styles.exerciseInfoRow}>
                            <View style={styles.exerciseNumBox}>
                              <Text style={styles.exerciseNumText}>{exIdx + 1}</Text>
                            </View>
                            <View style={styles.exerciseTextGroup}>
                              <View style={styles.exerciseNameRow}>
                                <Text style={styles.exerciseNameText} numberOfLines={1}>
                                  {ex.name}
                                </Text>
                                <TouchableOpacity
                                  style={styles.exerciseInfoBtn}
                                  activeOpacity={0.7}
                                  onPress={() => handleOpenExerciseInfo(ex)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  accessibilityLabel={`View details for ${ex.name}`}
                                >
                                  <Icon name="Info" size={15} color={OBSIDIAN_COLORS.cyanAccent} />
                                </TouchableOpacity>
                              </View>
                              <View style={styles.exerciseMetaRow}>
                                <View style={styles.tagChip}>
                                  <Text style={styles.tagChipText}>
                                    {ex.categoryTag || 'HYPERTROPHY'}
                                  </Text>
                                </View>
                                <Text style={styles.muscleTargetText}>
                                  {ex.muscleTarget || 'Primary Muscle'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Exercise Actions: Reorder Arrows, 6-Dot Drag Handle & Delete */}
                          <View style={styles.exerciseActionCluster}>
                            {currentDay.exercises.length > 1 && (
                              <View style={styles.reorderArrowsCol}>
                                <TouchableOpacity
                                  style={[
                                    styles.miniArrowBtn,
                                    exIdx === 0 && styles.miniArrowDisabled,
                                  ]}
                                  disabled={exIdx === 0}
                                  onPress={() => handleMoveExercise(exIdx, exIdx - 1)}
                                  activeOpacity={0.6}
                                  hitSlop={{ top: 6, bottom: 3, left: 6, right: 6 }}
                                  accessibilityLabel="Move exercise up"
                                >
                                  <Icon
                                    name="CaretUp"
                                    size={12}
                                    color={
                                      exIdx === 0
                                        ? 'rgba(255, 255, 255, 0.15)'
                                        : OBSIDIAN_COLORS.textMuted
                                    }
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.miniArrowBtn,
                                    exIdx === currentDay.exercises.length - 1 &&
                                      styles.miniArrowDisabled,
                                  ]}
                                  disabled={exIdx === currentDay.exercises.length - 1}
                                  onPress={() => handleMoveExercise(exIdx, exIdx + 1)}
                                  activeOpacity={0.6}
                                  hitSlop={{ top: 3, bottom: 6, left: 6, right: 6 }}
                                  accessibilityLabel="Move exercise down"
                                >
                                  <Icon
                                    name="CaretDown"
                                    size={12}
                                    color={
                                      exIdx === currentDay.exercises.length - 1
                                        ? 'rgba(255, 255, 255, 0.15)'
                                        : OBSIDIAN_COLORS.textMuted
                                    }
                                  />
                                </TouchableOpacity>
                              </View>
                            )}

                            {/* 6-Dot Drag Handle */}
                            <View
                              {...getPanResponder(exIdx).panHandlers}
                              style={[
                                styles.dragHandleBtn,
                                isBeingDragged && styles.dragHandleBtnActive,
                                Platform.OS === 'web' &&
                                  ({
                                    cursor: isBeingDragged ? 'grabbing' : 'grab',
                                  } as any),
                              ]}
                              accessibilityLabel="Drag to reorder exercise or tap for options"
                              accessibilityRole="button"
                            >
                              <Icon
                                name="DotsSixVertical"
                                size={19}
                                color={
                                  isBeingDragged
                                    ? OBSIDIAN_COLORS.voltLime
                                    : OBSIDIAN_COLORS.textMuted
                                }
                              />
                            </View>

                            {/* Delete Button */}
                            <TouchableOpacity
                              style={styles.deleteExBtn}
                              activeOpacity={0.7}
                              onPress={() => handleRemoveExercise(exIdx)}
                              accessibilityLabel="Delete exercise"
                            >
                              <Icon name="Trash" size={16} color={OBSIDIAN_COLORS.coralAccent} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* 3 Metrics Parameter Grid */}
                        <View style={styles.metricsGrid}>
                          <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>VOLUME</Text>
                            <View style={styles.metricInputRow}>
                              <TextInput
                                style={styles.metricTextInput}
                                keyboardType="numeric"
                                value={String(ex.target_sets)}
                                onChangeText={(val) =>
                                  handleUpdateExerciseParam(exIdx, 'target_sets', Number(val) || 1)
                                }
                              />
                              <Text style={styles.metricUnit}>Sets</Text>
                            </View>
                          </View>

                          <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>TARGET REPS</Text>
                            <TextInput
                              style={styles.metricTextInput}
                              value={ex.target_reps}
                              onChangeText={(val) =>
                                handleUpdateExerciseParam(exIdx, 'target_reps', val)
                              }
                            />
                          </View>

                          <View style={styles.metricBox}>
                            <Text style={styles.metricLabel}>RECOVERY</Text>
                            <View style={styles.metricInputRow}>
                              <TextInput
                                style={[styles.metricTextInput, { color: OBSIDIAN_COLORS.voltLime }]}
                                keyboardType="numeric"
                                value={String(ex.rest_seconds)}
                                onChangeText={(val) =>
                                  handleUpdateExerciseParam(exIdx, 'rest_seconds', Number(val) || 60)
                                }
                              />
                              <Text style={[styles.metricUnit, { color: OBSIDIAN_COLORS.voltLime }]}>
                                s
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}

                  {/* Add Exercise Dashed Button */}
                  <TouchableOpacity
                    style={styles.addExerciseBtn}
                    activeOpacity={0.8}
                    onPress={openExercisePicker}
                  >
                    <Icon name="Plus" size={18} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                    <Text style={styles.addExerciseText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Save Plan CTA */}
              <TouchableOpacity
                style={styles.savePlanBtn}
                activeOpacity={0.88}
                onPress={handleSavePlan}
                disabled={loading}
              >
                <Icon name="CheckCircle" size={20} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                <Text style={styles.savePlanText}>
                  {loading ? 'Saving Plan...' : 'Save Plan'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ================= AI IMPORT INGESTION MODE ================= */
            <View style={styles.aiSection}>
              <View style={styles.aiCard}>
                <View style={styles.aiHeaderPill}>
                  <Icon name="Sparkle" size={14} color={OBSIDIAN_COLORS.voltLime} />
                  <Text style={styles.aiHeaderPillText}>AI PLAN INGESTION</Text>
                </View>

                <Text style={styles.aiTitle}>AI Workout Plan Ingestion</Text>
                <Text style={styles.aiSubtitle}>
                  Got a routine from notes, Google Docs, or a gym whiteboard photo? Paste or snap it,
                  and IronLog AI will parse it into a structured split.
                </Text>

                {/* Input Mode Selector */}
                <View style={styles.aiToggleRow}>
                  <TouchableOpacity
                    style={[styles.aiToggleBtn, aiInputType === 'text' && styles.aiToggleBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setAiInputType('text')}
                  >
                    <Icon
                      name="PencilSimple"
                      size={16}
                      color={aiInputType === 'text' ? OBSIDIAN_COLORS.onPrimary : OBSIDIAN_COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.aiToggleBtnText,
                        aiInputType === 'text' && { color: OBSIDIAN_COLORS.onPrimary },
                      ]}
                    >
                      Paste Notes / Doc
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.aiToggleBtn, aiInputType === 'image' && styles.aiToggleBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setAiInputType('image')}
                  >
                    <Icon
                      name="Sparkle"
                      size={16}
                      color={aiInputType === 'image' ? OBSIDIAN_COLORS.onPrimary : OBSIDIAN_COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.aiToggleBtnText,
                        aiInputType === 'image' && { color: OBSIDIAN_COLORS.onPrimary },
                      ]}
                    >
                      Upload Screenshot
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Text or Image Input (F5: 20000 char maxLength) */}
                {aiInputType === 'text' ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>Routine Notes (Max 20,000 chars)</Text>
                    <TextInput
                      style={styles.aiTextArea}
                      multiline
                      numberOfLines={8}
                      maxLength={20000}
                      placeholder={`Paste routine here, e.g.:\nDay 1: Upper Body\n- Barbell Bench Press 4x8\n- Incline DB Press 3x10\n- Tricep Pushdown 3x12\n\nDay 2: Lower Body\n- Barbell Squats 4x8...`}
                      placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                      value={aiRoutineText}
                      onChangeText={setAiRoutineText}
                    />
                  </View>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>Workout Sheet Screenshot</Text>
                    {aiSelectedImage ? (
                      <View style={styles.imagePreviewWrapper}>
                        <Image source={{ uri: aiSelectedImage.uri }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.repickBtn} onPress={handlePickImage}>
                          <Icon name="ArrowClockwise" size={14} color={OBSIDIAN_COLORS.textWhite} />
                          <Text style={styles.repickText}>Change Photo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
                        <Icon name="Sparkle" size={32} color={OBSIDIAN_COLORS.voltLime} />
                        <Text style={styles.uploadTitle}>Tap to Select Workout Screenshot</Text>
                        <Text style={styles.uploadSubtitle}>
                          Supports photos of whiteboards, sheets, or apps
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.parseBtn}
                  activeOpacity={0.88}
                  onPress={handleRunAiParsing}
                  disabled={aiParsing}
                >
                  <Icon
                    name="Sparkle"
                    size={18}
                    color={OBSIDIAN_COLORS.onPrimary}
                    weight="bold"
                  />
                  <Text style={styles.parseBtnText}>
                    {aiParsing ? 'Extracting Routine...' : 'Parse & Extract Plan with AI'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* AI Parsed Result Preview */}
              {aiParsedResult && (
                <View style={styles.parsedResultCard}>
                  <Text style={styles.parsedBadge}>PARSED ROUTINE PREVIEW</Text>
                  <Text style={styles.parsedProgramName}>{aiParsedResult.program_name}</Text>
                  <Text style={styles.parsedProgramDesc}>
                    {aiParsedResult.description || 'Custom multi-day routine extracted from input.'}
                  </Text>

                  <View style={{ marginTop: 12, gap: 10 }}>
                    {aiParsedResult.days?.map((day: ParsedPlanDay, dIdx: number) => (
                      <View key={dIdx} style={styles.parsedDayCard}>
                        <Text style={styles.parsedDayName}>{day.day_name}</Text>
                        {day.exercises?.map((ex: ParsedPlanExercise, eIdx: number) => (
                          <View key={eIdx} style={styles.parsedExRow}>
                            <Text style={styles.parsedExName}>• {ex.name}</Text>
                            <Text style={styles.parsedExMeta}>
                              {ex.target_sets} sets × {ex.target_reps} reps ({ex.rest_seconds || 90}s rest)
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.applyAiPlanBtn}
                    activeOpacity={0.88}
                    onPress={handleApplyAiPlan}
                    disabled={loading}
                  >
                    <Icon name="CheckCircle" size={18} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                    <Text style={styles.applyAiPlanText}>
                      {loading ? 'Applying Plan...' : 'Save & Set as My Active Workout'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ================= 2-STEP EXERCISE PICKER MODAL ================= */}
        <Modal visible={isExercisePickerOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {pickerStep === 'categories' ? (
                <>
                  {/* Step 1: Select Muscle Group */}
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>Select Muscle Group</Text>
                      <Text style={styles.modalSubtitle}>
                        Choose a muscle group to view matching exercises
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsExercisePickerOpen(false)}>
                      <Icon name="X" size={22} color={OBSIDIAN_COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search across all exercises..."
                    placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={(val) => {
                      setSearchQuery(val);
                      if (val.trim().length > 0) {
                        setSelectedMuscleCategory('All Exercises');
                        setPickerStep('exercises');
                      }
                    }}
                  />

                  <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.muscleCategoriesGrid}>
                      {MUSCLE_CATEGORIES.map((cat) => {
                        const count = getMuscleExerciseCount(cat.id, cat.name);
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={styles.muscleCategoryCard}
                            activeOpacity={0.75}
                            onPress={() => {
                              setSelectedMuscleCategory(cat.name);
                              setPickerStep('exercises');
                              setSearchQuery('');
                              if (Platform.OS !== 'web') {
                                Haptics.selectionAsync().catch(() => {});
                              }
                            }}
                          >
                            <View style={[styles.muscleCategoryIconBox, { borderColor: cat.color }]}>
                              <Icon name={cat.icon} size={18} color={cat.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.muscleCategoryName}>{cat.name}</Text>
                              <Text style={styles.muscleCategoryFocus} numberOfLines={1}>
                                {cat.focus}
                              </Text>
                            </View>
                            <View style={styles.muscleCategoryCountBadge}>
                              <Text style={styles.muscleCategoryCountText}>{count}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </>
              ) : (
                <>
                  {/* Step 2: Select Exercise from Chosen Muscle Group */}
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.pickerBackBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setPickerStep('categories');
                        setSelectedMuscleCategory(null);
                        setSearchQuery('');
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync().catch(() => {});
                        }
                      }}
                    >
                      <Icon name="CaretLeft" size={16} color={OBSIDIAN_COLORS.voltLime} />
                      <Text style={styles.pickerBackText}>Muscles</Text>
                    </TouchableOpacity>

                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {selectedMuscleCategory}
                    </Text>

                    <TouchableOpacity onPress={() => setIsExercisePickerOpen(false)}>
                      <Icon name="X" size={22} color={OBSIDIAN_COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder={`Search in ${selectedMuscleCategory}...`}
                    placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />

                  {searchQuery.trim().length > 0 &&
                    !displayedExercises.some(
                      (e) => e.name.toLowerCase() === searchQuery.trim().toLowerCase()
                    ) && (
                      <TouchableOpacity
                        style={styles.customExercisePrompt}
                        onPress={() =>
                          handleSelectExercise(
                            searchQuery.trim(),
                            selectedMuscleCategory || 'Custom'
                          )
                        }
                      >
                        <Icon name="Plus" size={16} color={OBSIDIAN_COLORS.voltLime} />
                        <Text style={styles.customExerciseText}>
                          Create custom: "{searchQuery.trim()}"
                        </Text>
                      </TouchableOpacity>
                    )}

                  <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                    {displayedExercises.length === 0 ? (
                      <View style={styles.pickerEmptyState}>
                        <Icon name="MagnifyingGlass" size={28} color={OBSIDIAN_COLORS.textSlate} />
                        <Text style={styles.pickerEmptyTitle}>No matching exercises found</Text>
                        <Text style={styles.pickerEmptySub}>
                          Type a custom exercise name above to add it
                        </Text>
                      </View>
                    ) : (
                      displayedExercises.map((ex) => (
                        <View key={ex.id} style={styles.exercisePickerItem}>
                          <TouchableOpacity
                            style={styles.pickerItemMain}
                            activeOpacity={0.7}
                            onPress={() => handleSelectExercise(ex.name, ex.primary_muscle, ex.id)}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.pickerExName}>{ex.name}</Text>
                              <View style={styles.pickerExMetaRow}>
                                <View style={styles.pickerMuscleChip}>
                                  <Text style={styles.pickerMuscleChipText}>
                                    {ex.primary_muscle}
                                  </Text>
                                </View>
                                {ex.equipment && (
                                  <Text style={styles.pickerEquipmentText}>
                                    • {ex.equipment}
                                  </Text>
                                )}
                                {ex.difficulty && (
                                  <Text style={styles.pickerDifficultyText}>
                                    • {ex.difficulty}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>

                          {/* Info Button in Picker Item */}
                          <TouchableOpacity
                            style={styles.pickerInfoBtn}
                            activeOpacity={0.7}
                            onPress={() => handleOpenExerciseInfo(ex)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon name="Info" size={16} color={OBSIDIAN_COLORS.cyanAccent} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* ================= EXERCISE INFO HOVERING DIALOG ================= */}
        <Modal
          visible={selectedInfoExercise !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedInfoExercise(null)}
        >
          <Pressable
            style={styles.infoModalBackdrop}
            onPress={() => setSelectedInfoExercise(null)}
          >
            <Pressable
              style={styles.infoModalCard}
              onPress={(e) => e.stopPropagation()}
            >
              {selectedInfoExercise && (
                <>
                  {/* Header */}
                  <View style={styles.infoModalHeader}>
                    <View style={styles.infoModalHeaderLeft}>
                      <Text style={styles.infoModalTitle} numberOfLines={2}>
                        {selectedInfoExercise.name}
                      </Text>
                      <View style={styles.infoModalPillsRow}>
                        {selectedInfoExercise.difficulty && (
                          <View style={styles.infoDifficultyChip}>
                            <Text style={styles.infoDifficultyText}>
                              {selectedInfoExercise.difficulty.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        {selectedInfoExercise.equipment && (
                          <View style={styles.infoMetaChip}>
                            <Text style={styles.infoMetaText}>
                              {selectedInfoExercise.equipment}
                            </Text>
                          </View>
                        )}
                        {selectedInfoExercise.mechanics && (
                          <View style={styles.infoMetaChip}>
                            <Text style={styles.infoMetaText}>
                              {selectedInfoExercise.mechanics}
                            </Text>
                          </View>
                        )}
                        {selectedInfoExercise.force && (
                          <View style={styles.infoMetaChip}>
                            <Text style={styles.infoMetaText}>
                              {selectedInfoExercise.force}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setSelectedInfoExercise(null)}
                      style={styles.infoModalCloseBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="X" size={18} color={OBSIDIAN_COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Body Scroll */}
                  <ScrollView
                    style={styles.infoModalScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ gap: 14, paddingBottom: 8 }}
                  >
                    {/* Target Muscles */}
                    <View style={styles.infoSection}>
                      <Text style={styles.infoSectionLabel}>TARGET MUSCLES</Text>
                      <View style={styles.muscleChipsWrap}>
                        <View style={styles.primaryMuscleChip}>
                          <Text style={styles.primaryMuscleChipText}>
                            ★ {selectedInfoExercise.primary_muscle}
                          </Text>
                        </View>
                        {Array.isArray(selectedInfoExercise.primary_muscles_detailed) &&
                          selectedInfoExercise.primary_muscles_detailed
                            .filter((m) => m !== selectedInfoExercise.primary_muscle)
                            .map((m, idx) => (
                              <View key={`pm-${idx}`} style={styles.muscleDetailChip}>
                                <Text style={styles.muscleDetailChipText}>{m}</Text>
                              </View>
                            ))}
                        {Array.isArray(selectedInfoExercise.secondary_muscles_detailed) &&
                          selectedInfoExercise.secondary_muscles_detailed.map((m, idx) => (
                            <View key={`sm-${idx}`} style={styles.secondaryMuscleChip}>
                              <Text style={styles.secondaryMuscleChipText}>{m}</Text>
                            </View>
                          ))}
                      </View>
                    </View>

                    {/* Step-by-Step Instructions */}
                    <View style={styles.infoSection}>
                      <Text style={styles.infoSectionLabel}>STEP-BY-STEP INSTRUCTIONS</Text>
                      {Array.isArray(selectedInfoExercise.steps) &&
                      selectedInfoExercise.steps.length > 0 ? (
                        <View style={{ gap: 8 }}>
                          {selectedInfoExercise.steps.map((step) => (
                            <View key={step.step} style={styles.stepItemBox}>
                              <View style={styles.stepNumberBadge}>
                                <Text style={styles.stepNumberText}>{step.step}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                {step.name ? (
                                  <Text style={styles.stepNameTitle}>{step.name}</Text>
                                ) : null}
                                <Text style={styles.stepBodyText}>{step.text}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : selectedInfoExercise.instructions ? (
                        <Text style={styles.instructionsRawText}>
                          {selectedInfoExercise.instructions}
                        </Text>
                      ) : (
                        <Text style={styles.instructionsRawText}>
                          Standard execution: maintain core stability, full range of motion, and controlled eccentric tempo.
                        </Text>
                      )}
                    </View>

                    {/* Coaching Cues */}
                    {Array.isArray(selectedInfoExercise.coaching_cues) &&
                      selectedInfoExercise.coaching_cues.length > 0 && (
                        <View style={styles.infoSection}>
                          <Text style={[styles.infoSectionLabel, { color: OBSIDIAN_COLORS.voltLime }]}>
                            PRO COACHING CUES
                          </Text>
                          <View style={styles.cuesContainer}>
                            {selectedInfoExercise.coaching_cues.map((cue, idx) => (
                              <View key={`cue-${idx}`} style={styles.cueItemRow}>
                                <Icon name="CheckCircle" size={14} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                                <Text style={styles.cueText}>{cue}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                    {/* Common Mistakes */}
                    {Array.isArray(selectedInfoExercise.common_mistakes) &&
                      selectedInfoExercise.common_mistakes.length > 0 && (
                        <View style={styles.infoSection}>
                          <Text style={[styles.infoSectionLabel, { color: OBSIDIAN_COLORS.coralAccent }]}>
                            COMMON MISTAKES TO AVOID
                          </Text>
                          <View style={styles.mistakesContainer}>
                            {selectedInfoExercise.common_mistakes.map((mistake, idx) => (
                              <View key={`mistake-${idx}`} style={styles.mistakeItemRow}>
                                <Icon name="X" size={13} color={OBSIDIAN_COLORS.coralAccent} weight="bold" />
                                <Text style={styles.mistakeText}>{mistake}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                  </ScrollView>

                  {/* Dismiss Hint */}
                  <Text style={styles.infoDismissHint}>Tap anywhere outside or X to close</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.xs,
    paddingBottom: OBSIDIAN_SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  headerSubtitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 1,
  },
  headerRight: {},
  importModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  importModeBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  importModeText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.xs,
    paddingBottom: 60,
    gap: OBSIDIAN_SPACING.md,
  },
  programCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 6,
  },
  programLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  programNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  programInput: {
    flex: 1,
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 16,
  },
  scheduleSection: {
    gap: 6,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  scheduleLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  scheduleHint: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  daysScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dayPill: {
    width: 72,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    position: 'relative',
    marginRight: 6,
  },
  dayPillSelected: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderColor: 'rgba(204, 255, 0, 0.35)',
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dayPillRest: {
    opacity: 0.65,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
  },
  dayVoltDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  dayCodeText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
  },
  dayFocusText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  dayExCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    marginTop: 6,
  },
  dayExCountText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.textMuted,
  },
  selectedDayCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  selectedDayTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  restToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restToggleLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  restDayCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  restDayTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  restDayBody: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  exerciseSection: {
    gap: 10,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  exerciseCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseListLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  exerciseCountChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  exerciseCountChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  exerciseCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    position: 'relative',
    overflow: 'hidden',
    gap: 12,
  },
  exerciseVoltBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: 2,
  },
  exerciseInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  exerciseNumBox: {
    width: 24,
    height: 24,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  exerciseNumText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  exerciseTextGroup: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseNameText: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    fontSize: 15,
    color: OBSIDIAN_COLORS.textWhite,
  },
  exerciseInfoBtn: {
    padding: 2,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  tagChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 9,
  },
  muscleTargetText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  exerciseCardDragging: {
    zIndex: 9999,
    elevation: 12,
    borderColor: OBSIDIAN_COLORS.voltLime,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  exerciseCardTargetSlot: {
    borderColor: 'rgba(204, 255, 0, 0.45)',
    backgroundColor: 'rgba(204, 255, 0, 0.03)',
  },
  exerciseActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderArrowsCol: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 1,
  },
  miniArrowBtn: {
    padding: 2,
    borderRadius: 3,
  },
  miniArrowDisabled: {
    opacity: 0.35,
  },
  dragHandleBtn: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleBtnActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.18)',
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  dropIndicatorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  dropIndicatorTop: {
    top: 0,
  },
  dropIndicatorBottom: {
    bottom: 0,
  },
  dropIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    marginLeft: 0,
  },
  dropIndicatorBar: {
    flex: 1,
    height: 3,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  dragPill: {
    position: 'absolute',
    top: 6,
    right: 95,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.full,
    zIndex: 200,
  },
  dragPillText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 9,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  deleteExBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
    marginBottom: 2,
  },
  metricInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  metricTextInput: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: OBSIDIAN_COLORS.textWhite,
    textAlign: 'center',
    minWidth: 32,
  },
  metricUnit: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  addExerciseBtn: {
    height: 48,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(204, 255, 0, 0.4)',
    borderStyle: 'dashed',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addExerciseText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 14,
  },
  savePlanBtn: {
    height: 54,
    borderRadius: OBSIDIAN_RADIUS.xl,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  savePlanText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: OBSIDIAN_COLORS.onPrimary,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  aiSection: {
    gap: 12,
  },
  aiCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 10,
  },
  aiHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: OBSIDIAN_RADIUS.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  aiHeaderPillText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 9,
  },
  aiTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineMd,
    color: OBSIDIAN_COLORS.textWhite,
  },
  aiSubtitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 18,
  },
  aiToggleRow: {
    flexDirection: 'row',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 3,
    marginTop: 4,
    gap: 4,
  },
  aiToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: OBSIDIAN_RADIUS.md,
  },
  aiToggleBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  aiToggleBtnText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  fieldLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
    marginBottom: 6,
  },
  aiTextArea: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 12,
    color: OBSIDIAN_COLORS.textWhite,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    minHeight: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  imagePreviewWrapper: {
    borderRadius: OBSIDIAN_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  repickBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  repickText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 10,
    marginLeft: 4,
  },
  uploadArea: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadTitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: OBSIDIAN_COLORS.textWhite,
  },
  uploadSubtitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  parseBtn: {
    height: 52,
    borderRadius: OBSIDIAN_RADIUS.xl,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  parseBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: OBSIDIAN_COLORS.onPrimary,
    fontSize: 15,
  },
  parsedResultCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    gap: 8,
  },
  parsedBadge: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  parsedProgramName: {
    ...OBSIDIAN_TYPOGRAPHY.headlineMd,
    color: OBSIDIAN_COLORS.textWhite,
  },
  parsedProgramDesc: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
  },
  parsedDayCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 10,
    gap: 4,
  },
  parsedDayName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 13,
  },
  parsedExRow: {
    paddingLeft: 6,
  },
  parsedExName: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  parsedExMeta: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  applyAiPlanBtn: {
    height: 50,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  applyAiPlanText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: OBSIDIAN_COLORS.onPrimary,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 16, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderTopLeftRadius: OBSIDIAN_RADIUS.xl,
    borderTopRightRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.lg,
    borderTopWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  modalSearchInput: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  customExercisePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  customExerciseText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.voltLime,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  exercisePickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  pickerExName: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    color: OBSIDIAN_COLORS.textWhite,
  },
  pickerExMuscle: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 1,
  },
  modalSubtitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  muscleCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  muscleCategoryCard: {
    width: '48.5%',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleCategoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  muscleCategoryName: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 11,
  },
  muscleCategoryFocus: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  muscleCategoryCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
  },
  muscleCategoryCountText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 10,
    color: OBSIDIAN_COLORS.voltLime,
  },
  pickerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  pickerBackText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.voltLime,
  },
  pickerItemMain: {
    flex: 1,
  },
  pickerExMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  pickerMuscleChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
  },
  pickerMuscleChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: OBSIDIAN_COLORS.voltLime,
  },
  pickerEquipmentText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
  },
  pickerDifficultyText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 10,
    color: OBSIDIAN_COLORS.cyanAccent,
  },
  pickerInfoBtn: {
    padding: 8,
  },
  pickerEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  pickerEmptyTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    fontSize: 14,
    color: OBSIDIAN_COLORS.textWhite,
  },
  pickerEmptySub: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
  },
  infoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.md,
  },
  infoModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 12,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 10,
  },
  infoModalHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  infoModalTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    fontSize: 17,
    color: OBSIDIAN_COLORS.textWhite,
  },
  infoModalPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  infoDifficultyChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  infoDifficultyText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: OBSIDIAN_COLORS.voltLime,
  },
  infoMetaChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
  },
  infoMetaText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 10,
    color: OBSIDIAN_COLORS.textMuted,
  },
  infoModalCloseBtn: {
    padding: 4,
  },
  infoModalScroll: {
    flexShrink: 1,
  },
  infoSection: {
    gap: 6,
  },
  infoSectionLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 10,
    color: OBSIDIAN_COLORS.textMuted,
    letterSpacing: 0.8,
  },
  muscleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  primaryMuscleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  primaryMuscleChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 10,
    color: OBSIDIAN_COLORS.voltLime,
  },
  muscleDetailChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
  },
  muscleDetailChipText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 10,
    color: OBSIDIAN_COLORS.textWhite,
  },
  secondaryMuscleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  secondaryMuscleChipText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 10,
    color: OBSIDIAN_COLORS.cyanAccent,
  },
  stepItemBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    padding: 8,
    borderRadius: OBSIDIAN_RADIUS.md,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.voltLime,
  },
  stepNameTitle: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 11,
    color: OBSIDIAN_COLORS.textWhite,
    marginBottom: 2,
  },
  stepBodyText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 16,
  },
  instructionsRawText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 12,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 18,
  },
  cuesContainer: {
    gap: 6,
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
    padding: 10,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.15)',
  },
  cueItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cueText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 12,
    color: OBSIDIAN_COLORS.textWhite,
    flex: 1,
    lineHeight: 16,
  },
  mistakesContainer: {
    gap: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.04)',
    padding: 10,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  mistakeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mistakeText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 12,
    color: OBSIDIAN_COLORS.textWhite,
    flex: 1,
    lineHeight: 16,
  },
  infoDismissHint: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: OBSIDIAN_COLORS.textSlate,
    textAlign: 'center',
    paddingTop: 4,
  },
});

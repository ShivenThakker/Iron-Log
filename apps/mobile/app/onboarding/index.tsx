import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Icon, IconName } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
import { api } from '@/services/api';

const TOTAL_STEPS = 4;

interface GoalOption {
  id: string;
  title: string;
  desc: string;
  icon: IconName;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'Build Muscle',
    title: 'Build Muscle',
    desc: 'Hypertrophy & muscle mass development',
    icon: 'Barbell',
  },
  {
    id: 'Lose Fat',
    title: 'Lose Fat',
    desc: 'Caloric deficit with lean muscle preservation',
    icon: 'Flame',
  },
  {
    id: 'Get Stronger',
    title: 'Get Stronger',
    desc: 'Heavy compound strength & 1RM progression',
    icon: 'Trophy',
  },
  {
    id: 'Athletic Conditioning',
    title: 'Athletic Conditioning',
    desc: 'Work capacity, functional stamina & agility',
    icon: 'Lightning',
  },
];

const EXPERIENCE_LEVELS = [
  { id: 'Beginner', label: 'Beginner', sub: '< 6 mo' },
  { id: 'Intermediate', label: 'Intermediate', sub: '1–3 yrs' },
  { id: 'Advanced', label: 'Advanced', sub: '3+ yrs' },
];

const SPLIT_OPTIONS = [
  'Push / Pull / Legs',
  'Upper / Lower',
  'Full Body',
  'Arnold Split',
];

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbells',
  'Cables',
  'Machines',
  'Bodyweight',
  'Resistance Bands',
];

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Quads',
  'Hamstrings',
  'Glutes',
];

const JOINT_CAUTIONS = ['None', 'Shoulders', 'Lower Back', 'Knees'];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Biometrics
  const [name, setName] = useState('Athlete');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState(24);
  const [heightCm, setHeightCm] = useState(178);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightKg, setWeightKg] = useState(78.0);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  // Step 2: Goals & Experience
  const [primaryGoal, setPrimaryGoal] = useState('Build Muscle');
  const [targetWeightKg, setTargetWeightKg] = useState(75.0);
  const [experience, setExperience] = useState('Intermediate');

  // Step 3: Training Setup
  const [frequency, setFrequency] = useState(5);
  const [splitPref, setSplitPref] = useState('Push / Pull / Legs');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Barbell',
    'Dumbbells',
    'Cables',
    'Machines',
    'Bodyweight',
  ]);
  const [focusMuscles, setFocusMuscles] = useState<string[]>([
    'Chest',
    'Back',
    'Shoulders',
    'Arms',
  ]);
  const [selectedJointCaution, setSelectedJointCaution] = useState('None');

  // Step 4: Smart Progression
  const [smartProgression, setSmartProgression] = useState(true);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const toggleMuscle = (muscle: string) => {
    setFocusMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => {});
      }
    } else {
      router.back();
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      // 1. Update user profile
      await api
        .put('/users/profile', {
          name: name.trim() || undefined,
          gender: sex,
          age,
          height_cm: heightCm,
          weight_kg: weightKg,
          target_weight_kg: targetWeightKg,
          fitness_goal: primaryGoal,
          experience_level: experience,
          schedule_days_per_week: frequency,
          workout_duration_min: 60,
          training_split_preference: splitPref,
          focus_areas: focusMuscles,
          injuries_limitations: selectedJointCaution !== 'None' ? selectedJointCaution : undefined,
          track_nutrition: true,
          daily_calorie_target: primaryGoal === 'Lose Fat' ? 2000 : 2600,
        })
        .catch(() => null);

      // 2. Register equipment profile
      if (selectedEquipment.length > 0) {
        await api
          .post('/equipment', {
            name: 'Primary Gym Setup',
            equipment_types: selectedEquipment,
            is_active: true,
          })
          .catch(() => null);
      }

      // 3. Log initial weight
      if (weightKg) {
        await api
          .post('/body/weight', {
            weight_kg: weightKg,
            logged_at: new Date().toISOString(),
          })
          .catch(() => null);
      }

      // 4. Request initial AI workout plan generation in background
      api
        .post('/ai/generate-plan', {
          fitness_goal: primaryGoal,
          experience_level: experience,
          days_per_week: frequency,
          equipment: selectedEquipment,
          split_preference: splitPref,
        })
        .catch(() => null);

      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const weightDelta = Math.round((targetWeightKg - weightKg) * 10) / 10;
  const deltaLabel =
    weightDelta < 0
      ? `${weightDelta} kg from current`
      : weightDelta === 0
      ? 'Maintain baseline'
      : `+${weightDelta} kg from current`;

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <View style={styles.container}>
        {/* Top Header Bar with Progress */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Icon name="CaretLeft" size={22} color={OBSIDIAN_COLORS.textWhite} />
          </TouchableOpacity>

          <View style={styles.progressCenter}>
            <Text style={styles.stepIndicatorText}>Step {step} of 4</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${(step / 4) * 100}%` }]} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            activeOpacity={0.7}
            onPress={() => (step < 4 ? setStep(step + 1) : handleFinish())}
          >
            <Text style={styles.skipBtnText}>{step === 4 ? '' : 'Skip'}</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Step Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ================= STEP 1: BASELINE BIOMETRICS ================= */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleBlock}>
                <Text style={styles.stepTitle}>Tell us about yourself</Text>
                <Text style={styles.stepSubtitle}>
                  Baseline biometrics to tailor your training volume and target weights.
                </Text>
              </View>

              {/* Name or Gym Nickname */}
              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>NAME OR GYM NICKNAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name..."
                  placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                />
              </View>

              {/* Biological Sex */}
              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>BIOLOGICAL SEX</Text>
                <View style={styles.sexSelectorRow}>
                  {(['Male', 'Female', 'Other'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.sexOptionBtn,
                        sex === option && styles.sexOptionBtnActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSex(option);
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync().catch(() => {});
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.sexOptionText,
                          sex === option && { color: OBSIDIAN_COLORS.onPrimary },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Age & Height Grid */}
              <View style={styles.grid2Col}>
                {/* Age Box */}
                <View style={styles.metricCard}>
                  <Text style={styles.fieldLabel}>AGE</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricNumber}>{age}</Text>
                    <Text style={styles.metricUnit}>yrs</Text>
                  </View>
                  <View style={styles.stepperControlRow}>
                    <TouchableOpacity
                      style={styles.miniStepperBtn}
                      activeOpacity={0.7}
                      onPress={() => setAge((a) => Math.max(14, a - 1))}
                    >
                      <Text style={styles.stepperIcon}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniStepperBtn}
                      activeOpacity={0.7}
                      onPress={() => setAge((a) => Math.min(100, a + 1))}
                    >
                      <Text style={styles.stepperIcon}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Height Box */}
                <View style={styles.metricCard}>
                  <View style={styles.cardHeaderWithToggle}>
                    <Text style={styles.fieldLabel}>HEIGHT</Text>
                    <View style={styles.unitToggleMini}>
                      <TouchableOpacity
                        style={[
                          styles.unitToggleChip,
                          heightUnit === 'cm' && styles.unitToggleChipActive,
                        ]}
                        onPress={() => setHeightUnit('cm')}
                      >
                        <Text
                          style={[
                            styles.unitToggleChipText,
                            heightUnit === 'cm' && { color: OBSIDIAN_COLORS.onPrimary },
                          ]}
                        >
                          cm
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.unitToggleChip,
                          heightUnit === 'ft' && styles.unitToggleChipActive,
                        ]}
                        onPress={() => setHeightUnit('ft')}
                      >
                        <Text
                          style={[
                            styles.unitToggleChipText,
                            heightUnit === 'ft' && { color: OBSIDIAN_COLORS.onPrimary },
                          ]}
                        >
                          ft
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricNumber}>
                      {heightUnit === 'cm' ? heightCm : '5\'10"'}
                    </Text>
                    <Text style={styles.metricUnit}>{heightUnit === 'cm' ? 'cm' : ''}</Text>
                  </View>
                  <View style={styles.stepperControlRow}>
                    <TouchableOpacity
                      style={styles.miniStepperBtn}
                      activeOpacity={0.7}
                      onPress={() => setHeightCm((h) => Math.max(120, h - 1))}
                    >
                      <Text style={styles.stepperIcon}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniStepperBtn}
                      activeOpacity={0.7}
                      onPress={() => setHeightCm((h) => Math.min(230, h + 1))}
                    >
                      <Text style={styles.stepperIcon}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Current Weight Card */}
              <View style={styles.weightCard}>
                <View style={styles.cardHeaderWithToggle}>
                  <Text style={styles.fieldLabel}>CURRENT WEIGHT</Text>
                  <View style={styles.unitToggleMini}>
                    <TouchableOpacity
                      style={[
                        styles.unitToggleChip,
                        weightUnit === 'kg' && styles.unitToggleChipActive,
                      ]}
                      onPress={() => setWeightUnit('kg')}
                    >
                      <Text
                        style={[
                          styles.unitToggleChipText,
                          weightUnit === 'kg' && { color: OBSIDIAN_COLORS.onPrimary },
                        ]}
                      >
                        kg
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitToggleChip,
                        weightUnit === 'lbs' && styles.unitToggleChipActive,
                      ]}
                      onPress={() => setWeightUnit('lbs')}
                    >
                      <Text
                        style={[
                          styles.unitToggleChipText,
                          weightUnit === 'lbs' && { color: OBSIDIAN_COLORS.onPrimary },
                        ]}
                      >
                        lbs
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.weightDialRow}>
                  <TouchableOpacity
                    style={styles.weightDialBtn}
                    activeOpacity={0.8}
                    onPress={() => setWeightKg((w) => Math.max(30, Math.round((w - 0.5) * 10) / 10))}
                  >
                    <Text style={styles.weightDialIcon}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.weightNumberRow}>
                    <Text style={styles.weightBigNumber}>{weightKg.toFixed(1)}</Text>
                    <Text style={styles.weightUnitText}>{weightUnit}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.weightDialBtn}
                    activeOpacity={0.8}
                    onPress={() => setWeightKg((w) => Math.min(200, Math.round((w + 0.5) * 10) / 10))}
                  >
                    <Text style={styles.weightDialIcon}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 2: GOALS & EXPERIENCE ================= */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleBlock}>
                <View style={styles.kickerBadge}>
                  <Text style={styles.kickerBadgeText}>GOALS & EXPERIENCE</Text>
                </View>
                <Text style={styles.stepTitle}>What's your goal?</Text>
                <Text style={styles.stepSubtitle}>
                  Select your primary fitness objective to calibrate your training and nutrition targets.
                </Text>
              </View>

              {/* 01 Primary Goal */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.sectionNumLabel}>01 • PRIMARY GOAL</Text>
                  <Text style={styles.sectionExtraHint}>SINGLE SELECT</Text>
                </View>

                <View style={{ gap: 8 }}>
                  {GOAL_OPTIONS.map((g) => {
                    const isSelected = primaryGoal === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[
                          styles.goalCard,
                          isSelected && styles.goalCardSelected,
                        ]}
                        activeOpacity={0.85}
                        onPress={() => {
                          setPrimaryGoal(g.id);
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.goalIconBox,
                            isSelected && { backgroundColor: OBSIDIAN_COLORS.voltLime },
                          ]}
                        >
                          <Icon
                            name={g.icon}
                            size={22}
                            color={isSelected ? OBSIDIAN_COLORS.onPrimary : OBSIDIAN_COLORS.textMuted}
                            weight={isSelected ? 'fill' : 'regular'}
                          />
                        </View>
                        <View style={styles.goalInfo}>
                          <View style={styles.goalTitleRow}>
                            <Text
                              style={[
                                styles.goalTitle,
                                isSelected && { color: OBSIDIAN_COLORS.textWhite, fontFamily: 'SpaceGrotesk_700Bold' },
                              ]}
                            >
                              {g.title}
                            </Text>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected,
                              ]}
                            >
                              {isSelected && <View style={styles.radioDot} />}
                            </View>
                          </View>
                          <Text style={styles.goalDesc} numberOfLines={1}>
                            {g.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 02 Target Weight */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.sectionNumLabel}>02 • TARGET WEIGHT</Text>
                  <Text style={styles.sectionExtraHint}>Current: {weightKg.toFixed(1)} kg</Text>
                </View>

                <View style={styles.targetWeightCard}>
                  <View style={styles.targetWeightTop}>
                    <View>
                      <Text style={styles.fieldLabel}>TARGET BODYWEIGHT</Text>
                      <View style={styles.targetNumRow}>
                        <Text style={styles.targetNumText}>{targetWeightKg.toFixed(1)}</Text>
                        <Text style={styles.targetNumUnit}>kg</Text>
                      </View>
                    </View>
                    <View style={styles.deltaPill}>
                      <Text style={styles.deltaPillText}>{deltaLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.stepperControlRowFull}>
                    <TouchableOpacity
                      style={styles.fullStepperBtn}
                      activeOpacity={0.7}
                      onPress={() =>
                        setTargetWeightKg((w) => Math.max(30, Math.round((w - 0.5) * 10) / 10))
                      }
                    >
                      <Text style={styles.fullStepperIcon}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.fullStepperBtn}
                      activeOpacity={0.7}
                      onPress={() =>
                        setTargetWeightKg((w) => Math.min(200, Math.round((w + 0.5) * 10) / 10))
                      }
                    >
                      <Text style={styles.fullStepperIcon}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 03 Experience Level */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.sectionNumLabel}>03 • EXPERIENCE LEVEL</Text>
                  <Text style={styles.sectionExtraHint}>TRAINING AGE</Text>
                </View>

                <View style={styles.experienceGrid}>
                  {EXPERIENCE_LEVELS.map((exp) => {
                    const isSelected = experience === exp.id;
                    return (
                      <TouchableOpacity
                        key={exp.id}
                        style={[
                          styles.expBtn,
                          isSelected && styles.expBtnSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setExperience(exp.id);
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.expLabel,
                            isSelected && { color: OBSIDIAN_COLORS.onPrimary },
                          ]}
                        >
                          {exp.label}
                        </Text>
                        <Text
                          style={[
                            styles.expSub,
                            isSelected && { color: OBSIDIAN_COLORS.onPrimary, opacity: 0.85 },
                          ]}
                        >
                          {exp.sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 3: TRAINING CONFIGURATION ================= */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleBlock}>
                <View style={styles.kickerBadge}>
                  <Text style={styles.kickerBadgeText}>TRAINING CONFIGURATION</Text>
                </View>
                <Text style={styles.stepTitle}>Training Setup</Text>
                <Text style={styles.stepSubtitle}>
                  Configure your frequency, equipment, and focus areas to shape your routine.
                </Text>
              </View>

              {/* Weekly Frequency */}
              <View style={styles.fieldCard}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.fieldLabel}>WEEKLY FREQUENCY</Text>
                  <Text style={[styles.fieldLabel, { color: OBSIDIAN_COLORS.voltLime }]}>
                    {frequency} Days / Week
                  </Text>
                </View>

                <View style={styles.freqRow}>
                  {[2, 3, 4, 5, 6].map((days) => {
                    const isSelected = frequency === days;
                    return (
                      <TouchableOpacity
                        key={days}
                        style={[
                          styles.freqBtn,
                          isSelected && styles.freqBtnSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setFrequency(days);
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.freqNum,
                            isSelected && { color: OBSIDIAN_COLORS.onPrimary },
                          ]}
                        >
                          {days}
                        </Text>
                        <Text
                          style={[
                            styles.freqSub,
                            isSelected && { color: OBSIDIAN_COLORS.onPrimary },
                          ]}
                        >
                          Days
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Preferred Split */}
              <View style={styles.fieldCard}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.fieldLabel}>PREFERRED SPLIT</Text>
                  <Text style={styles.sectionExtraHint}>RECOMMENDED</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {SPLIT_OPTIONS.map((split) => {
                    const isSelected = splitPref === split;
                    return (
                      <TouchableOpacity
                        key={split}
                        style={[
                          styles.splitPill,
                          isSelected && styles.splitPillSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSplitPref(split);
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                        }}
                      >
                        {isSelected && (
                          <Icon name="Check" size={14} color={OBSIDIAN_COLORS.onPrimary} weight="bold" />
                        )}
                        <Text
                          style={[
                            styles.splitPillText,
                            isSelected && { color: OBSIDIAN_COLORS.onPrimary, fontFamily: 'SpaceGrotesk_700Bold' },
                          ]}
                        >
                          {split}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Available Equipment */}
              <View style={styles.fieldCard}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.fieldLabel}>AVAILABLE EQUIPMENT</Text>
                  <Text style={[styles.fieldLabel, { color: OBSIDIAN_COLORS.voltLime }]}>
                    {selectedEquipment.length} Selected
                  </Text>
                </View>
                <View style={styles.chipsWrap}>
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const isSelected = selectedEquipment.includes(eq);
                    return (
                      <TouchableOpacity
                        key={eq}
                        style={[
                          styles.equipChip,
                          isSelected && styles.equipChipSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleEquipment(eq)}
                      >
                        <Icon
                          name={isSelected ? 'Check' : 'Plus'}
                          size={13}
                          color={isSelected ? OBSIDIAN_COLORS.onPrimary : OBSIDIAN_COLORS.textMuted}
                          weight="bold"
                        />
                        <Text
                          style={[
                            styles.equipChipText,
                            isSelected && { color: OBSIDIAN_COLORS.onPrimary, fontFamily: 'SpaceGrotesk_700Bold' },
                          ]}
                        >
                          {eq}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Focus Muscle Groups */}
              <View style={styles.fieldCard}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.fieldLabel}>FOCUS MUSCLE GROUPS</Text>
                  <Text style={styles.sectionExtraHint}>OPTIONAL</Text>
                </View>
                <View style={styles.chipsWrap}>
                  {MUSCLE_GROUPS.map((m) => {
                    const isSelected = focusMuscles.includes(m);
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.muscleChip,
                          isSelected && styles.muscleChipSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleMuscle(m)}
                      >
                        <Text
                          style={[
                            styles.muscleChipText,
                            isSelected && { color: OBSIDIAN_COLORS.onPrimary, fontFamily: 'SpaceGrotesk_700Bold' },
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Joint Cautions */}
              <View style={styles.fieldCard}>
                <View style={styles.sectionHeaderLine}>
                  <Text style={styles.fieldLabel}>JOINT CAUTIONS</Text>
                  <Text style={styles.sectionExtraHint}>PROTECTION</Text>
                </View>
                <View style={styles.chipsWrap}>
                  {JOINT_CAUTIONS.map((j) => {
                    const isSelected = selectedJointCaution === j;
                    return (
                      <TouchableOpacity
                        key={j}
                        style={[
                          styles.jointChip,
                          isSelected && styles.jointChipSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedJointCaution(j);
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.jointChipText,
                            isSelected && { color: OBSIDIAN_COLORS.voltLime },
                          ]}
                        >
                          {j}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 4: FINAL CONFIRMATION ================= */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleBlock}>
                <View style={styles.kickerBadge}>
                  <Text style={styles.kickerBadgeText}>FINAL CONFIRMATION</Text>
                </View>
                <Text style={styles.stepTitle}>Profile Ready, Athlete!</Text>
                <Text style={styles.stepSubtitle}>
                  Here is your baseline setup summary. Tap below to generate your personalized AI split.
                </Text>
              </View>

              {/* Athlete Identity Hero Card */}
              <View style={styles.athleteHeroCard}>
                <View style={styles.athleteAvatarCircle}>
                  <Icon name="Barbell" size={26} color={OBSIDIAN_COLORS.voltLime} weight="bold" />
                </View>
                <View style={styles.athleteHeroInfo}>
                  <View style={styles.athleteNameRow}>
                    <Text style={styles.athleteName}>{name || 'Athlete'}</Text>
                    <View style={styles.athleteTagBadge}>
                      <Text style={styles.athleteTagText}>ATHLETE</Text>
                    </View>
                  </View>
                  <Text style={styles.athleteBioMeta}>
                    {age} yrs • {heightCm} cm • {weightKg} kg{' '}
                    <Text style={{ color: OBSIDIAN_COLORS.voltLime }}>→ {targetWeightKg} kg</Text>
                  </Text>
                </View>
              </View>

              {/* Configuration Bento Stack */}
              <View style={styles.bentoStack}>
                <View style={styles.bentoHeaderRow}>
                  <Text style={styles.bentoHeaderTitle}>CONFIGURATION SUMMARY</Text>
                  <Text style={styles.bentoHeaderSub}>STEPS 1–3</Text>
                </View>

                {/* Item 1: Goal */}
                <View style={styles.bentoItem}>
                  <View style={styles.bentoItemLeft}>
                    <View style={styles.bentoIconBox}>
                      <Icon name="Flame" size={18} color={OBSIDIAN_COLORS.voltLime} weight="fill" />
                    </View>
                    <View>
                      <Text style={styles.bentoItemTitle}>{primaryGoal}</Text>
                      <Text style={styles.bentoItemSub}>Goal Strategy</Text>
                    </View>
                  </View>
                  <View style={styles.bentoPillRight}>
                    <Text style={styles.bentoPillRightText}>{deltaLabel}</Text>
                  </View>
                </View>

                {/* Item 2: Schedule */}
                <View style={styles.bentoItem}>
                  <View style={styles.bentoItemLeft}>
                    <View style={styles.bentoIconBox}>
                      <Icon name="CalendarCheck" size={18} color={OBSIDIAN_COLORS.voltLime} />
                    </View>
                    <View>
                      <Text style={styles.bentoItemTitle}>{frequency} Days / Week</Text>
                      <Text style={styles.bentoItemSub}>{splitPref}</Text>
                    </View>
                  </View>
                  <View style={styles.bentoPillRight}>
                    <Text style={styles.bentoPillRightText}>SPLIT</Text>
                  </View>
                </View>

                {/* Item 3: Experience */}
                <View style={styles.bentoItem}>
                  <View style={styles.bentoItemLeft}>
                    <View style={styles.bentoIconBox}>
                      <Icon name="ChartLineUp" size={18} color={OBSIDIAN_COLORS.voltLime} />
                    </View>
                    <View>
                      <Text style={styles.bentoItemTitle}>{experience}</Text>
                      <Text style={styles.bentoItemSub}>Experience & Workload</Text>
                    </View>
                  </View>
                  <View style={styles.bentoPillRight}>
                    <Text style={styles.bentoPillRightText}>RPE 8-9</Text>
                  </View>
                </View>

                {/* Item 4: Equipment */}
                <View style={styles.bentoItem}>
                  <View style={styles.bentoItemLeft}>
                    <View style={styles.bentoIconBox}>
                      <Icon name="Barbell" size={18} color={OBSIDIAN_COLORS.voltLime} />
                    </View>
                    <View>
                      <Text style={styles.bentoItemTitle}>Equipment Setup</Text>
                      <Text style={styles.bentoItemSub}>
                        {selectedEquipment.slice(0, 3).join(', ')}
                        {selectedEquipment.length > 3 ? ` +${selectedEquipment.length - 3}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bentoPillRight}>
                    <Text style={styles.bentoPillRightText}>{selectedEquipment.length} SELECTED</Text>
                  </View>
                </View>
              </View>

              {/* Smart Progression Card */}
              <View style={styles.smartCard}>
                <View style={styles.smartLeft}>
                  <View style={styles.smartIconBox}>
                    <Icon name="Gear" size={18} color={OBSIDIAN_COLORS.voltLime} />
                  </View>
                  <View style={styles.smartInfo}>
                    <Text style={styles.smartTitle}>Smart Progression</Text>
                    <Text style={styles.smartSub}>
                      Automatically adjust weights based on logged sets and RPE
                    </Text>
                  </View>
                </View>
                <Switch
                  value={smartProgression}
                  onValueChange={setSmartProgression}
                  trackColor={{ false: '#272A35', true: OBSIDIAN_COLORS.voltLime }}
                  thumbColor={OBSIDIAN_COLORS.textWhite}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Floating CTA Bar */}
        <View style={styles.footerCTA}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.88}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={OBSIDIAN_COLORS.onPrimary} />
            ) : (
              <>
                <Text style={styles.continueBtnText}>
                  {step === 4 ? 'GENERATE MY ATHLETE SPLIT' : 'CONTINUE'}
                </Text>
                <Icon
                  name={step === 4 ? 'Sparkle' : 'CaretRight'}
                  size={18}
                  color={OBSIDIAN_COLORS.onPrimary}
                  weight="bold"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.xs,
    paddingBottom: OBSIDIAN_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCenter: {
    alignItems: 'center',
    gap: 4,
  },
  stepIndicatorText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  progressBarTrack: {
    width: 130,
    height: 4,
    borderRadius: 2,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    borderRadius: 2,
  },
  skipBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipBtnText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.sm,
    paddingBottom: 110,
  },
  stepContainer: {
    gap: OBSIDIAN_SPACING.md,
  },
  stepTitleBlock: {
    gap: 4,
    marginVertical: 4,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    marginBottom: 2,
  },
  kickerBadgeText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 9,
  },
  stepTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineLgMobile,
    color: OBSIDIAN_COLORS.textWhite,
  },
  stepSubtitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    lineHeight: 18,
  },
  fieldCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 8,
  },
  fieldLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  textInput: {
    height: 48,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingHorizontal: 12,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 15,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sexSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    padding: 3,
    borderRadius: OBSIDIAN_RADIUS.lg,
  },
  sexOptionBtn: {
    flex: 1,
    height: 42,
    borderRadius: OBSIDIAN_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexOptionBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  sexOptionText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  grid2Col: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    justifyContent: 'space-between',
  },
  cardHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitToggleMini: {
    flexDirection: 'row',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    padding: 2,
    borderRadius: OBSIDIAN_RADIUS.sm,
  },
  unitToggleChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.sm,
  },
  unitToggleChipActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  unitToggleChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 6,
  },
  metricNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    color: OBSIDIAN_COLORS.textWhite,
  },
  metricUnit: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  stepperControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniStepperBtn: {
    width: 36,
    height: 36,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperIcon: {
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 22,
  },
  weightCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 10,
  },
  weightDialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  weightDialBtn: {
    width: 48,
    height: 48,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightDialIcon: {
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 28,
  },
  weightNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  weightBigNumber: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 36,
    color: OBSIDIAN_COLORS.textWhite,
  },
  weightUnitText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 14,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionNumLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  sectionExtraHint: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
  },
  goalCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalCardSelected: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderColor: 'rgba(204, 255, 0, 0.4)',
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  goalIconBox: {
    width: 44,
    height: 44,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
    gap: 2,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 15,
  },
  goalDesc: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: OBSIDIAN_COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: OBSIDIAN_COLORS.voltLime,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OBSIDIAN_COLORS.onPrimary,
  },
  targetWeightCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 12,
  },
  targetWeightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  targetNumText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    color: OBSIDIAN_COLORS.textWhite,
  },
  targetNumUnit: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 14,
  },
  deltaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: 'rgba(0, 227, 253, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 227, 253, 0.25)',
  },
  deltaPillText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.cyanAccent,
    fontSize: 10,
  },
  stepperControlRowFull: {
    flexDirection: 'row',
    gap: 10,
  },
  fullStepperBtn: {
    flex: 1,
    height: 44,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullStepperIcon: {
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  experienceGrid: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    padding: 3,
    borderRadius: OBSIDIAN_RADIUS.xl,
  },
  expBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: OBSIDIAN_RADIUS.lg,
    gap: 2,
  },
  expBtnSelected: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  expLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  expSub: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 6,
  },
  freqBtn: {
    flex: 1,
    height: 52,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  freqBtnSelected: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  freqNum: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: OBSIDIAN_COLORS.textWhite,
  },
  freqSub: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: OBSIDIAN_COLORS.textMuted,
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  splitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: OBSIDIAN_RADIUS.full,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    marginRight: 6,
  },
  splitPillSelected: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  splitPillText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
  },
  equipChipSelected: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  equipChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
  },
  muscleChipSelected: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  muscleChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  jointChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
  },
  jointChipSelected: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  jointChipText: {
    ...OBSIDIAN_TYPOGRAPHY.labelInteractive,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  athleteHeroCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  athleteAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  athleteHeroInfo: {
    flex: 1,
  },
  athleteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  athleteName: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  athleteTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  athleteTagText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 9,
  },
  athleteBioMeta: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
    fontSize: 12,
  },
  bentoStack: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 8,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bentoHeaderTitle: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
  },
  bentoHeaderSub: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 10,
  },
  bentoItem: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bentoIconBox: {
    width: 34,
    height: 34,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoItemTitle: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 13,
  },
  bentoItemSub: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
  },
  bentoPillRight: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
  },
  bentoPillRightText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 9,
  },
  smartCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  smartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  smartIconBox: {
    width: 36,
    height: 36,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartInfo: {
    flex: 1,
  },
  smartTitle: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 14,
  },
  smartSub: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  footerCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.md,
    backgroundColor: 'rgba(16, 19, 28, 0.95)',
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
  },
  continueBtn: {
    height: 54,
    borderRadius: OBSIDIAN_RADIUS.xl,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  continueBtnText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: OBSIDIAN_COLORS.onPrimary,
    letterSpacing: 0.5,
  },
});

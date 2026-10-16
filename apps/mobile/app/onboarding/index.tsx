import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

const TOTAL_STEPS = 16;

const GOALS = [
  { id: 'Build Muscle', title: 'Build Muscle', desc: 'Maximize hypertrophy & lean mass', icon: 'Barbell' },
  { id: 'Lose Fat', title: 'Lose Fat', desc: 'Caloric deficit with high protein retention', icon: 'Flame' },
  { id: 'Get Stronger', title: 'Get Stronger', desc: 'Focus on compound strength & progressive overload', icon: 'Trophy' },
  { id: 'Stay Healthy', title: 'Stay Healthy', desc: 'Functional fitness, endurance & longevity', icon: 'Heart' },
] as const;

const EXPERIENCES = [
  { id: 'Beginner', title: 'Beginner', desc: '< 6 months of structured lifting' },
  { id: 'Intermediate', title: 'Intermediate', desc: '6 months – 2 years consistent training' },
  { id: 'Advanced', title: 'Advanced', desc: '2+ years of progressive overload training' },
] as const;

const DURATIONS = ['30 min', '45 min', '60 min', '75 min', '90 min'];
const FREQUENCIES = [2, 3, 4, 5, 6];
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbells', 'Cables', 'Machines', 'Bodyweight', 'Resistance Bands'];
const SPLIT_OPTIONS = ['Push / Pull / Legs (PPL)', 'Upper / Lower', 'Full Body', 'Arnold Split', 'Bro Split'];
const MUSCLE_AREAS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Glutes', 'Core'];
const COMMON_LIMITATIONS = ['Lower Back', 'Shoulders', 'Knees', 'Wrists', 'None'];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('24');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightVal, setHeightVal] = useState('178');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [currentWeight, setCurrentWeight] = useState('78');
  const [targetWeight, setTargetWeight] = useState('82');
  const [primaryGoal, setPrimaryGoal] = useState('Build Muscle');
  const [experience, setExperience] = useState('Intermediate');
  const [frequency, setFrequency] = useState(4);
  const [duration, setDuration] = useState('60 min');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Barbell', 'Dumbbells', 'Cables', 'Machines']);
  const [splitPref, setSplitPref] = useState('Push / Pull / Legs (PPL)');
  const [focusAreas, setFocusAreas] = useState<string[]>(['Chest', 'Back', 'Shoulders']);
  const [selectedLimitation, setSelectedLimitation] = useState('None');
  const [limitationNotes, setLimitationNotes] = useState('');
  const [trackNutrition, setTrackNutrition] = useState(true);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState('2600');

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    setLoading(true);
    try {
      const heightInCm = heightUnit === 'cm' ? Number(heightVal) : Math.round(Number(heightVal) * 30.48);
      const weightInKg = weightUnit === 'kg' ? Number(currentWeight) : Math.round(Number(currentWeight) * 0.453592);
      const targetWeightInKg = weightUnit === 'kg' ? Number(targetWeight) : Math.round(Number(targetWeight) * 0.453592);

      // 1. Update user profile
      await api.put('/users/profile', {
        name: name || undefined,
        gender,
        age: Number(age) || 25,
        height_cm: heightInCm || 178,
        weight_kg: weightInKg || 78,
        target_weight_kg: targetWeightInKg || 80,
        fitness_goal: primaryGoal,
        experience_level: experience,
        schedule_days_per_week: frequency,
        workout_duration_min: parseInt(duration, 10) || 60,
        training_split_preference: splitPref,
        focus_areas: focusAreas,
        injuries_limitations: selectedLimitation !== 'None' ? `${selectedLimitation}: ${limitationNotes}` : undefined,
        track_nutrition: trackNutrition,
        daily_calorie_target: trackNutrition ? Number(dailyCalorieTarget) : undefined,
      }).catch(() => null);

      // 2. Register equipment profile
      if (selectedEquipment.length > 0) {
        await api.post('/equipment', {
          name: 'Primary Gym Setup',
          equipment_types: selectedEquipment,
          is_active: true,
        }).catch(() => null);
      }

      // 3. Log initial weight
      if (weightInKg) {
        await api.post('/body/weight', {
          weight_kg: weightInKg,
          logged_at: new Date().toISOString(),
        }).catch(() => null);
      }

      // 4. Request initial AI workout plan generation in background
      api.post('/ai/generate-plan', {
        fitness_goal: primaryGoal,
        experience_level: experience,
        days_per_week: frequency,
        equipment: selectedEquipment,
        split_preference: splitPref,
      }).catch(() => null);

      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 1 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>What should we call you?</Text>
            <Text variant="body" style={styles.subheading}>
              Your AI coach will tailor guidance and rank milestones directly to you.
            </Text>
            <Input
              label="Your Full Name or Gym Nickname"
              placeholder="e.g. Alex Hunter"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 2 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>What is your biological sex?</Text>
            <Text variant="body" style={styles.subheading}>
              Used for precise BMR / TDEE metabolic calculations and strength standards.
            </Text>
            <View style={styles.cardsGrid}>
              {['Male', 'Female', 'Prefer not to say'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.choiceCard, gender === g && styles.choiceCardActive]}
                  onPress={() => setGender(g)}
                >
                  <Text variant="h3" style={[styles.choiceTitle, gender === g && styles.choiceTitleActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 3 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>How old are you?</Text>
            <Text variant="body" style={styles.subheading}>
              Recovery windows and periodization adapt based on your age.
            </Text>
            <Input
              label="Age (Years)"
              placeholder="25"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 4 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>What is your height?</Text>
            <Text variant="body" style={styles.subheading}>
              Helps us calculate leverage curves and healthy body mass metrics.
            </Text>
            <View style={styles.unitToggleRow}>
              <TouchableOpacity
                style={[styles.unitBtn, heightUnit === 'cm' && styles.unitBtnActive]}
                onPress={() => setHeightUnit('cm')}
              >
                <Text style={[styles.unitBtnText, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, heightUnit === 'ft' && styles.unitBtnActive]}
                onPress={() => setHeightUnit('ft')}
              >
                <Text style={[styles.unitBtnText, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft</Text>
              </TouchableOpacity>
            </View>
            <Input
              label={`Height in ${heightUnit.toUpperCase()}`}
              placeholder={heightUnit === 'cm' ? '178' : '5.10'}
              keyboardType="numeric"
              value={heightVal}
              onChangeText={setHeightVal}
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 5 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>What is your current weight?</Text>
            <Text variant="body" style={styles.subheading}>
              Starting point for your weight trends, 1RM ratios, and progressive overload.
            </Text>
            <View style={styles.unitToggleRow}>
              <TouchableOpacity
                style={[styles.unitBtn, weightUnit === 'kg' && styles.unitBtnActive]}
                onPress={() => setWeightUnit('kg')}
              >
                <Text style={[styles.unitBtnText, weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, weightUnit === 'lbs' && styles.unitBtnActive]}
                onPress={() => setWeightUnit('lbs')}
              >
                <Text style={[styles.unitBtnText, weightUnit === 'lbs' && styles.unitBtnTextActive]}>lbs</Text>
              </TouchableOpacity>
            </View>
            <Input
              label={`Current Weight (${weightUnit})`}
              placeholder={weightUnit === 'kg' ? '78' : '172'}
              keyboardType="numeric"
              value={currentWeight}
              onChangeText={setCurrentWeight}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 6 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>What is your target weight?</Text>
            <Text variant="body" style={styles.subheading}>
              Set a realistic milestone to track on your Body progress dashboard.
            </Text>
            <Input
              label={`Target Weight (${weightUnit})`}
              placeholder={weightUnit === 'kg' ? '82' : '180'}
              keyboardType="numeric"
              value={targetWeight}
              onChangeText={setTargetWeight}
            />
          </View>
        );

      case 7:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 7 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>What is your primary goal?</Text>
            <Text variant="body" style={styles.subheading}>
              Directly influences rep ranges, RPE targets, and weekly volume distribution.
            </Text>
            <View style={styles.cardsGrid}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.goalCard, primaryGoal === g.id && styles.choiceCardActive]}
                  onPress={() => setPrimaryGoal(g.id)}
                >
                  <View style={styles.goalCardHeader}>
                    <Icon name={g.icon as any} size={24} color={primaryGoal === g.id ? COLORS.dark.accentRed : COLORS.dark.textSecondary} />
                    <Text variant="h3" style={[styles.choiceTitle, primaryGoal === g.id && styles.choiceTitleActive]}>
                      {g.title}
                    </Text>
                  </View>
                  <Text variant="caption" style={styles.goalCardDesc}>
                    {g.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 8:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 8 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Training Experience</Text>
            <Text variant="body" style={styles.subheading}>
              Determines adaptive volume ramping and exercise complexity.
            </Text>
            <View style={styles.cardsGrid}>
              {EXPERIENCES.map((exp) => (
                <TouchableOpacity
                  key={exp.id}
                  style={[styles.goalCard, experience === exp.id && styles.choiceCardActive]}
                  onPress={() => setExperience(exp.id)}
                >
                  <Text variant="h3" style={[styles.choiceTitle, experience === exp.id && styles.choiceTitleActive]}>
                    {exp.title}
                  </Text>
                  <Text variant="caption" style={styles.goalCardDesc}>
                    {exp.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 9:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 9 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>How many days per week can you train?</Text>
            <Text variant="body" style={styles.subheading}>
              Consistency trumps perfection. Pick a schedule you can maintain week after week.
            </Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqCard, frequency === f && styles.freqCardActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text variant="h1" style={[styles.freqNum, frequency === f && styles.freqNumActive]}>
                    {f}
                  </Text>
                  <Text variant="caption" style={frequency === f ? styles.freqLabelActive : styles.freqLabel}>
                    days/wk
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 10:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 10 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Target Workout Duration</Text>
            <Text variant="body" style={styles.subheading}>
              We calibrate the total set volume to fit strictly within your available time window.
            </Text>
            <View style={styles.cardsGrid}>
              {DURATIONS.map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[styles.choiceCard, duration === dur && styles.choiceCardActive]}
                  onPress={() => setDuration(dur)}
                >
                  <Text variant="h3" style={[styles.choiceTitle, duration === dur && styles.choiceTitleActive]}>
                    {dur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 11:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 11 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Available Equipment</Text>
            <Text variant="body" style={styles.subheading}>
              Select everything accessible to you. Multi-select all that apply.
            </Text>
            <View style={styles.chipsWrap}>
              {EQUIPMENT_OPTIONS.map((item) => {
                const selected = selectedEquipment.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.multiChip, selected && styles.multiChipSelected]}
                    onPress={() => toggleEquipment(item)}
                  >
                    <Icon
                      name={selected ? 'CheckCircle' : 'Plus'}
                      size={18}
                      color={selected ? '#FFFFFF' : COLORS.dark.textSecondary}
                    />
                    <Text
                      variant="bodySmall"
                      style={[styles.multiChipText, selected && styles.multiChipTextSelected]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 12:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 12 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Preferred Training Split</Text>
            <Text variant="body" style={styles.subheading}>
              Choose the program structure you enjoy most.
            </Text>
            <View style={styles.cardsGrid}>
              {SPLIT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.choiceCard, splitPref === s && styles.choiceCardActive]}
                  onPress={() => setSplitPref(s)}
                >
                  <Text variant="h3" style={[styles.choiceTitle, splitPref === s && styles.choiceTitleActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 13:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 13 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Focus Muscle Areas</Text>
            <Text variant="body" style={styles.subheading}>
              Select groups you want the AI coach to prioritize with extra volume or frequency.
            </Text>
            <View style={styles.chipsWrap}>
              {MUSCLE_AREAS.map((muscle) => {
                const selected = focusAreas.includes(muscle);
                return (
                  <TouchableOpacity
                    key={muscle}
                    style={[styles.multiChip, selected && styles.multiChipSelected]}
                    onPress={() => toggleFocusArea(muscle)}
                  >
                    <Text
                      variant="bodySmall"
                      style={[styles.multiChipText, selected && styles.multiChipTextSelected]}
                    >
                      {muscle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 14:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 14 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Any Injuries or Limitations?</Text>
            <Text variant="body" style={styles.subheading}>
              We will avoid aggravating exercises and suggest joint-friendly alternatives.
            </Text>
            <View style={styles.chipsWrap}>
              {COMMON_LIMITATIONS.map((lim) => (
                <TouchableOpacity
                  key={lim}
                  style={[styles.multiChip, selectedLimitation === lim && styles.multiChipSelected]}
                  onPress={() => setSelectedLimitation(lim)}
                >
                  <Text
                    variant="bodySmall"
                    style={[styles.multiChipText, selectedLimitation === lim && styles.multiChipTextSelected]}
                  >
                    {lim}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedLimitation !== 'None' && (
              <Input
                label="Extra details (optional)"
                placeholder="e.g. slight impingement on overhead movements"
                value={limitationNotes}
                onChangeText={setLimitationNotes}
                style={{ marginTop: SPACING.md }}
              />
            )}
          </View>
        );

      case 15:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 15 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Nutrition Tracking</Text>
            <Text variant="body" style={styles.subheading}>
              Do you want to log daily calories and macros with our USDA food search engine?
            </Text>
            <View style={styles.cardsGrid}>
              <TouchableOpacity
                style={[styles.choiceCard, trackNutrition && styles.choiceCardActive]}
                onPress={() => setTrackNutrition(true)}
              >
                <Text variant="h3" style={[styles.choiceTitle, trackNutrition && styles.choiceTitleActive]}>
                  Yes, track my nutrition 🥗
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceCard, !trackNutrition && styles.choiceCardActive]}
                onPress={() => setTrackNutrition(false)}
              >
                <Text variant="h3" style={[styles.choiceTitle, !trackNutrition && styles.choiceTitleActive]}>
                  No, just focus on workouts 💪
                </Text>
              </TouchableOpacity>
            </View>
            {trackNutrition && (
              <Input
                label="Daily Calorie Goal (kcal)"
                placeholder="2600"
                keyboardType="numeric"
                value={dailyCalorieTarget}
                onChangeText={setDailyCalorieTarget}
                style={{ marginTop: SPACING.lg }}
              />
            )}
          </View>
        );

      case 16:
        return (
          <View style={styles.stepBox}>
            <Text variant="caption" style={styles.kicker}>STEP 16 OF {TOTAL_STEPS}</Text>
            <Text variant="h1" style={styles.heading}>Profile Complete!</Text>
            <Text variant="body" style={styles.subheading}>
              Here is your setup summary. Confirm to generate your personalized AI routine.
            </Text>

            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text variant="caption" style={styles.summaryLabel}>ATHLETE</Text>
                <Text variant="body" style={styles.summaryVal}>{name || 'Rookie Lifter'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="caption" style={styles.summaryLabel}>PRIMARY GOAL</Text>
                <Text variant="body" style={styles.summaryVal}>{primaryGoal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="caption" style={styles.summaryLabel}>FREQUENCY & SPLIT</Text>
                <Text variant="body" style={styles.summaryVal}>{frequency} days/wk • {splitPref}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="caption" style={styles.summaryLabel}>EXPERIENCE</Text>
                <Text variant="body" style={styles.summaryVal}>{experience}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="caption" style={styles.summaryLabel}>STARTING RANK</Text>
                <Badge label="ROOKIE (+100 ONBOARDING XP)" variant="gold" />
              </View>
            </GlassCard>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <View style={styles.progressTextRow}>
            <Text variant="caption" style={styles.stepCountText}>
              Step {step} of {TOTAL_STEPS}
            </Text>
            {step < TOTAL_STEPS && (
              <TouchableOpacity onPress={handleFinish}>
                <Text variant="caption" style={styles.skipText}>
                  Skip Setup →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Step Body */}
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {renderStepContent()}
        </ScrollView>

        {/* Bottom Navigation Actions */}
        <View style={styles.footerRow}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text variant="body" style={styles.backBtnText}>
                Back
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={{ flex: 2 }}>
            <GradientButton
              title={step === TOTAL_STEPS ? 'Generate My Plan 🚀' : 'Continue'}
              loading={loading}
              onPress={step === TOTAL_STEPS ? handleFinish : handleNext}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.dark.accentRed,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  stepCountText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  skipText: {
    color: COLORS.dark.accentGold,
    fontWeight: '700',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  stepBox: {
    marginTop: SPACING.sm,
  },
  kicker: {
    color: COLORS.dark.accentGold,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  heading: {
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.xs,
  },
  subheading: {
    color: COLORS.dark.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  cardsGrid: {
    gap: SPACING.md,
  },
  choiceCard: {
    backgroundColor: COLORS.dark.bgSecondary,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  choiceCardActive: {
    borderColor: COLORS.dark.accentRed,
    backgroundColor: 'rgba(233, 69, 96, 0.12)',
  },
  choiceTitle: {
    color: COLORS.dark.textPrimary,
  },
  choiceTitleActive: {
    color: COLORS.dark.accentRed,
    fontWeight: 'bold',
  },
  goalCard: {
    backgroundColor: COLORS.dark.bgSecondary,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  goalCardDesc: {
    color: COLORS.dark.textSecondary,
    lineHeight: 18,
  },
  unitToggleRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.md,
    padding: 3,
    alignSelf: 'flex-start',
  },
  unitBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
  },
  unitBtnActive: {
    backgroundColor: COLORS.dark.accentRed,
  },
  unitBtnText: {
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  freqRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  freqCard: {
    flex: 1,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  freqCardActive: {
    borderColor: COLORS.dark.accentRed,
    backgroundColor: 'rgba(233, 69, 96, 0.12)',
  },
  freqNum: {
    color: COLORS.dark.textPrimary,
  },
  freqNumActive: {
    color: COLORS.dark.accentRed,
  },
  freqLabel: {
    color: COLORS.dark.textSecondary,
    marginTop: 4,
  },
  freqLabelActive: {
    color: COLORS.dark.accentRed,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  multiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dark.bgSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  multiChipSelected: {
    backgroundColor: COLORS.dark.accentRed,
    borderColor: COLORS.dark.accentRed,
  },
  multiChipText: {
    color: COLORS.dark.textSecondary,
  },
  multiChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  summaryCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: SPACING.xs,
  },
  summaryLabel: {
    color: COLORS.dark.textSecondary,
  },
  summaryVal: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: COLORS.dark.bgPrimary,
  },
  backBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtnText: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
});

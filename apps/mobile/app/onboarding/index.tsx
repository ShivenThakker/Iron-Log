import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/tokens';
import { api } from '../../services/api';

const GOALS = ['Build Muscle', 'Lose Fat', 'Recomposition', 'Get Stronger'];
const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced'];
const EQUIPMENT = ['Full Gym', 'Home Gym', 'Bodyweight Only'];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [goal, setGoal] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [experience, setExperience] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('4');
  const [equipment, setEquipment] = useState('');

  const handleNext = () => setStep(s => Math.min(6, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Send the onboarding profile data to the specific API route created previously
      await api.put('/users/profile', {
        fitness_goal: goal,
        gender,
        height_cm: Number(heightCm),
        target_weight_kg: Number(targetWeightKg),
        experience_level: experience,
        schedule_days_per_week: Number(daysPerWeek),
      });
      
      // Save equipment type to profile
      if (equipment) {
         await api.post('/equipment', { name: equipment, equipment_types: [], is_active: true }).catch(() => null);
      }

      // Record first weight log via an API (if necessary) or defer to offline storage sync
      if (weightKg) {
         await api.post('/body/weight', { weight_kg: Number(weightKg), logged_at: new Date() }).catch(() => null);
      }
      
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
      // Failsafe to enter app nevertheless so users aren't locked out of the MVP during testing
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What is your primary goal?</Text>
      <View style={styles.options}>
        {GOALS.map(g => (
          <TouchableOpacity 
            key={g} 
            style={[styles.optionCard, goal === g && styles.optionCardActive]}
            onPress={() => setGoal(g)}
          >
            <Text style={[styles.optionText, goal === g && styles.optionTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Your Body Profile</Text>
      <Text style={styles.subtitle}>Help IronLog tailor your macros and weights.</Text>
      <Text style={styles.label}>Gender</Text>
      <View style={{flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md}}>
        {['Male', 'Female'].map(g => (
            <TouchableOpacity key={g} style={[styles.optionCard, {flex: 1}, gender === g && styles.optionCardActive]} onPress={() => setGender(g)}>
                <Text style={[styles.optionText, gender === g && styles.optionTextActive]}>{g}</Text>
            </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Height (cm)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} placeholder="175" placeholderTextColor={COLORS.dark.textSecondary}/>
      
      <Text style={styles.label}>Current Weight (kg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} placeholder="75" placeholderTextColor={COLORS.dark.textSecondary}/>
      
      <Text style={styles.label}>Target Weight (kg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={targetWeightKg} onChangeText={setTargetWeightKg} placeholder="80" placeholderTextColor={COLORS.dark.textSecondary}/>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Training Experience</Text>
      <View style={styles.options}>
        {EXPERIENCE.map(e => (
          <TouchableOpacity key={e} style={[styles.optionCard, experience === e && styles.optionCardActive]} onPress={() => setExperience(e)}>
            <Text style={[styles.optionText, experience === e && styles.optionTextActive]}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, {marginTop: SPACING.xl}]}>Days per week (1-7)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={daysPerWeek} onChangeText={setDaysPerWeek} />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Equipment Setup</Text>
      <View style={styles.options}>
        {EQUIPMENT.map(e => (
          <TouchableOpacity key={e} style={[styles.optionCard, equipment === e && styles.optionCardActive]} onPress={() => setEquipment(e)}>
            <Text style={[styles.optionText, equipment === e && styles.optionTextActive]}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Never Miss a Session</Text>
      <Text style={styles.subtitle}>Allow push notifications to keep your streak alive and receive AI adjustments.</Text>
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>Notifications Request Dialog</Text>
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>You are a ROOKIE</Text>
      <Text style={styles.subtitle}>Welcome to the IronLog gamification system. Every workout, PR, and streak earns you XP. Unlock trophies and climb the 12 ranks.</Text>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 72}}>🏅</Text>
        <Text style={{color: COLORS.dark.accentGold, fontSize: 24, fontWeight: 'bold', marginTop: SPACING.md}}>0 XP</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.progressHeader}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>{step} / 6</Text>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        ) : <View style={{flex: 1}} />}

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={step === 6 ? handleComplete : handleNext}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={COLORS.dark.textPrimary} /> : <Text style={styles.primaryButtonText}>{step === 6 ? "Finish" : "Continue"}</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: SPACING.xl * 2 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.dark.bgSecondary, borderRadius: RADIUS.full, marginRight: SPACING.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.dark.accentRed },
  stepText: { color: COLORS.dark.textSecondary, fontSize: 14, fontWeight: 'bold' },
  stepContainer: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark.textPrimary, marginBottom: SPACING.sm },
  subtitle: { fontSize: 16, color: COLORS.dark.textSecondary, marginBottom: SPACING.xl, lineHeight: 22 },
  label: { color: COLORS.dark.textSecondary, fontSize: 14, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.dark.bgInput, color: COLORS.dark.textPrimary, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: 16 },
  options: { gap: SPACING.md },
  optionCard: { backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 2, borderColor: 'transparent' },
  optionCardActive: { borderColor: COLORS.dark.accentRed, backgroundColor: '#3E1C2E' },
  optionText: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: '500', textAlign: 'center' },
  optionTextActive: { color: COLORS.dark.accentRed, fontWeight: 'bold' },
  footer: { flexDirection: 'row', gap: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  primaryButton: { flex: 2, backgroundColor: COLORS.dark.accentRed, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { flex: 1, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.dark.bgInput },
  secondaryButtonText: { color: COLORS.dark.textPrimary, fontSize: 16, fontWeight: '600' },
  placeholderBox: { flex: 1, borderWidth: 2, borderColor: COLORS.dark.bgInput, borderStyle: 'dashed', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  placeholderText: { color: COLORS.dark.textSecondary }
});

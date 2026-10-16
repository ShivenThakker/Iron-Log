import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.branding}>
        <Text style={styles.title}>IRONLOG</Text>
        <Text style={styles.subtitle}>Your AI Fitness Companion</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/register')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.bgPrimary,
    justifyContent: 'space-between',
    padding: SPACING.xl,
  },
  branding: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.dark.accentRed,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.dark.textSecondary,
  },
  actions: {
    gap: SPACING.md,
    marginBottom: SPACING.xl * 2,
  },
  primaryButton: {
    backgroundColor: COLORS.dark.accentRed,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.dark.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.dark.bgInput,
  },
  secondaryButtonText: {
    color: COLORS.dark.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  }
});

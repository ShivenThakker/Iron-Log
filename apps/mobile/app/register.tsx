import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_SPACING,
  OBSIDIAN_RADIUS,
} from '@/constants/tokens';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterScreen() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', { email: email.trim(), password, name: name.trim() });
      await loginStore(res.data.accessToken, res.data.refreshToken, res.data.userId);
      router.replace('/onboarding');
    } catch (err: any) {
      if (err?.response?.data?.error) {
        if (Array.isArray(err.response.data.error)) {
          setError(err.response.data.error.map((e: any) => e.message).join('\n'));
        } else {
          setError(err.response.data.error);
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Dismiss */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Icon name="CaretLeft" size={24} color={OBSIDIAN_COLORS.textWhite} />
            </TouchableOpacity>
          </View>

          {/* Header Branding */}
          <View style={styles.header}>
            <Text style={styles.title}>Join IronLog</Text>
            <Text style={styles.subtitle}>Begin your journey towards a stronger you.</Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Icon name="X" size={16} color={OBSIDIAN_COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex Morgan"
                placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (error) setError('');
                }}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="athlete@ironlog.app"
                placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError('');
                }}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError('');
                }}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={OBSIDIAN_COLORS.onPrimaryFixed} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginPrompt}>
              <Text style={styles.promptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.promptLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: OBSIDIAN_SPACING.xl,
    paddingBottom: OBSIDIAN_SPACING['2xl'],
  },
  topBar: {
    paddingTop: Platform.OS === 'android' ? OBSIDIAN_SPACING.lg : OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    marginBottom: OBSIDIAN_SPACING.xl,
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 30,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: -0.5,
    marginBottom: OBSIDIAN_SPACING.xs,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.lg,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: OBSIDIAN_COLORS.error,
  },
  form: {
    gap: OBSIDIAN_SPACING.lg,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  input: {
    height: 52,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: OBSIDIAN_COLORS.textWhite,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  registerButton: {
    height: 56,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: OBSIDIAN_SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: OBSIDIAN_COLORS.primaryFixed,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.onPrimaryFixed,
    letterSpacing: 0.3,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: OBSIDIAN_SPACING.md,
  },
  promptText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
  },
  promptLink: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.primaryFixed,
  },
});

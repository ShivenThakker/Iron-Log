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
  Modal,
  Alert,
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

export default function LoginScreen() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      await loginStore(res.data.accessToken, res.data.refreshToken, res.data.userId);
      router.replace('/(tabs)');
    } catch (err) {
      const axiosErr = err as { code?: string; message?: string; response?: { status?: number; data?: { error?: string } } };
      if (axiosErr.response?.data?.error) {
        setError(axiosErr.response.data.error);
      } else if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
        setError('Connection timed out. Server may be waking up, please tap Login again.');
      } else if (!axiosErr.response) {
        setError('Cannot reach server. Please check your internet connection.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccessMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() });
      if (res.data.devResetCode) {
        setForgotToken(res.data.devResetCode);
      }
      setForgotSuccessMsg(res.data.message || 'If an account exists with this email, password reset instructions have been sent.');
      setForgotStep('reset');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setForgotError(axiosErr.response?.data?.error || 'Unable to request password reset. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail.trim().toLowerCase(),
        token: forgotToken.trim() || undefined,
        new_password: forgotNewPassword,
      });

      Alert.alert(
        'Password Updated',
        res.data.message || 'Your password has been reset successfully! You can now log in.',
        [
          {
            text: 'OK',
            onPress: () => {
              setEmail(forgotEmail.trim().toLowerCase());
              setPassword(forgotNewPassword);
              setShowForgotModal(false);
              setForgotStep('request');
              setForgotNewPassword('');
              setForgotToken('');
            },
          },
        ]
      );
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setForgotError(axiosErr.response?.data?.error || 'Failed to reset password. Please check your reset code.');
    } finally {
      setForgotLoading(false);
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your credentials to resume your grind.</Text>
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
              <View style={styles.passwordHeaderRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity
                  onPress={() => {
                    setForgotEmail(email);
                    setForgotError('');
                    setForgotSuccessMsg('');
                    setForgotStep('request');
                    setShowForgotModal(true);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon
                    name={showPassword ? 'EyeSlash' : 'Eye'}
                    size={20}
                    color={OBSIDIAN_COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={OBSIDIAN_COLORS.onPrimaryFixed} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerPrompt}>
              <Text style={styles.promptText}>Don't have an account yet? </Text>
              <TouchableOpacity onPress={() => router.replace('/register')}>
                <Text style={styles.promptLink}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!forgotLoading) setShowForgotModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Icon name="Lock" size={20} color={OBSIDIAN_COLORS.voltLime} />
                <Text style={styles.modalTitle}>
                  {forgotStep === 'request' ? 'Reset Password' : 'Enter New Password'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!forgotLoading) setShowForgotModal(false);
                }}
                disabled={forgotLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="X" size={20} color={OBSIDIAN_COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {forgotError ? (
              <View style={styles.modalErrorBanner}>
                <Icon name="X" size={16} color={OBSIDIAN_COLORS.error} />
                <Text style={styles.modalErrorText}>{forgotError}</Text>
              </View>
            ) : null}

            {forgotSuccessMsg ? (
              <View style={styles.modalSuccessBanner}>
                <Icon name="CheckCircle" size={16} color={OBSIDIAN_COLORS.voltLime} />
                <Text style={styles.modalSuccessText}>{forgotSuccessMsg}</Text>
              </View>
            ) : null}

            {forgotStep === 'request' ? (
              <View style={styles.modalForm}>
                <Text style={styles.modalSubtitle}>
                  Enter your registered account email and we'll help you reset your password.
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="athlete@ironlog.app"
                    placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    value={forgotEmail}
                    onChangeText={(t) => {
                      setForgotEmail(t);
                      if (forgotError) setForgotError('');
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, forgotLoading && styles.loginButtonDisabled]}
                  onPress={handleForgotPasswordSubmit}
                  disabled={forgotLoading}
                  activeOpacity={0.88}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color={OBSIDIAN_COLORS.onPrimaryFixed} />
                  ) : (
                    <Text style={styles.loginButtonText}>Continue to Reset</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalForm}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>RESET CODE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                    autoCapitalize="none"
                    value={forgotToken}
                    onChangeText={(t) => {
                      setForgotToken(t);
                      if (forgotError) setForgotError('');
                    }}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>NEW PASSWORD</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Min. 8 characters"
                      placeholderTextColor={OBSIDIAN_COLORS.textMuted}
                      secureTextEntry={!showForgotNewPassword}
                      value={forgotNewPassword}
                      onChangeText={(t) => {
                        setForgotNewPassword(t);
                        if (forgotError) setForgotError('');
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowForgotNewPassword((prev) => !prev)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name={showForgotNewPassword ? 'EyeSlash' : 'Eye'}
                        size={20}
                        color={OBSIDIAN_COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, forgotLoading && styles.loginButtonDisabled]}
                  onPress={handleResetPasswordSubmit}
                  disabled={forgotLoading}
                  activeOpacity={0.88}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color={OBSIDIAN_COLORS.onPrimaryFixed} />
                  ) : (
                    <Text style={styles.loginButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchStepBtn}
                  onPress={() => {
                    setForgotStep('request');
                    setForgotError('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchStepText}>Change email address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.onPrimaryFixed,
    letterSpacing: 0.3,
  },
  registerPrompt: {
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
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPasswordLink: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 0.3,
  },
  passwordInputContainer: {
    height: 52,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.lg,
    paddingLeft: OBSIDIAN_SPACING.md,
    paddingRight: OBSIDIAN_SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: OBSIDIAN_COLORS.textWhite,
  },
  eyeButton: {
    padding: OBSIDIAN_SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.lg,
  },
  modalCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.xl,
    padding: OBSIDIAN_SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: OBSIDIAN_SPACING.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 18,
    fontWeight: '700',
    color: OBSIDIAN_COLORS.textWhite,
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  modalForm: {
    gap: OBSIDIAN_SPACING.md,
  },
  modalButton: {
    height: 52,
    borderRadius: OBSIDIAN_RADIUS.lg,
    backgroundColor: OBSIDIAN_COLORS.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: OBSIDIAN_SPACING.xs,
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  modalErrorText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: OBSIDIAN_COLORS.error,
  },
  modalSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(202, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(202, 255, 0, 0.3)',
    borderRadius: OBSIDIAN_RADIUS.md,
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.sm,
    marginBottom: OBSIDIAN_SPACING.sm,
  },
  modalSuccessText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: OBSIDIAN_COLORS.voltLime,
  },
  switchStepBtn: {
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.xs,
  },
  switchStepText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
});

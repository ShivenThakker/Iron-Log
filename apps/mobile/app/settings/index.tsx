import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
} from '@/constants/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [restTimerDefault, setRestTimerDefault] = useState('90s');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const { data: profileData } = useQuery({
    queryKey: ['settingsProfile'],
    queryFn: async () => {
      const res = await api.get('/users/profile').catch(() => null);
      return res?.data ?? null;
    },
  });

  const user = profileData?.user;
  const userName = user?.name || 'Iron Athlete';
  const userEmail = user?.email || 'athlete@ironlog.app';

  // Fix F13 preserved: send refreshToken on logout
  const handleLogout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      await api.post('/auth/logout', { refreshToken }).catch(() => null);
      await logout();
      router.replace('/');
    } catch {
      await logout();
      router.replace('/');
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your IronLog account and training history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false} theme="obsidian">
      <View style={styles.container}>
        <Header title="Settings" showBack={true} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* User Profile Card */}
          <GlassCard variant="obsidianLevel2" style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>⚡</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text variant="headlineSm" style={styles.userName}>{userName}</Text>
              <Text variant="bodySm" style={styles.userEmail}>{userEmail}</Text>
              <Badge label="Iron Athlete" variant="volt" style={{ marginTop: 8 }} />
            </View>
          </GlassCard>

          {/* Preferences Section */}
          <Text variant="labelCaps" style={styles.sectionHeader}>WORKOUT PREFERENCES</Text>
          <GlassCard variant="obsidianLevel1" style={styles.settingsGroup}>
            {/* Weight Unit */}
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text variant="labelInteractive" style={styles.rowTitle}>Weight Unit</Text>
                <Text variant="bodySm" style={styles.rowSub}>Metric (kg) vs Imperial (lbs)</Text>
              </View>
              <View style={styles.segmentedToggle}>
                <TouchableOpacity
                  style={[styles.segBtn, weightUnit === 'kg' && styles.segBtnActive]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text style={[styles.segText, weightUnit === 'kg' && styles.segTextActive]}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segBtn, weightUnit === 'lbs' && styles.segBtnActive]}
                  onPress={() => setWeightUnit('lbs')}
                >
                  <Text style={[styles.segText, weightUnit === 'lbs' && styles.segTextActive]}>lbs</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Default Rest Timer */}
            <View style={[styles.row, styles.borderTop]}>
              <View style={styles.rowTextCol}>
                <Text variant="labelInteractive" style={styles.rowTitle}>Default Rest Timer</Text>
                <Text variant="bodySm" style={styles.rowSub}>Auto-countdown between sets</Text>
              </View>
              <View style={styles.segmentedToggle}>
                {['60s', '90s', '120s'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.segBtn, restTimerDefault === time && styles.segBtnActive]}
                    onPress={() => setRestTimerDefault(time)}
                  >
                    <Text style={[styles.segText, restTimerDefault === time && styles.segTextActive]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </GlassCard>

          {/* App Experience Section */}
          <Text variant="labelCaps" style={styles.sectionHeader}>EXPERIENCE & FEEDBACK</Text>
          <GlassCard variant="obsidianLevel1" style={styles.settingsGroup}>
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text variant="labelInteractive" style={styles.rowTitle}>Push Notifications</Text>
                <Text variant="bodySm" style={styles.rowSub}>Streak reminders and workout prompts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: OBSIDIAN_COLORS.surfaceContainerHighest, true: OBSIDIAN_COLORS.voltLime }}
                thumbColor={OBSIDIAN_COLORS.textWhite}
              />
            </View>

            <View style={[styles.row, styles.borderTop]}>
              <View style={styles.rowTextCol}>
                <Text variant="labelInteractive" style={styles.rowTitle}>Haptic Feedback</Text>
                <Text variant="bodySm" style={styles.rowSub}>Vibration on set completion & PRs</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: OBSIDIAN_COLORS.surfaceContainerHighest, true: OBSIDIAN_COLORS.voltLime }}
                thumbColor={OBSIDIAN_COLORS.textWhite}
              />
            </View>
          </GlassCard>

          {/* Account Actions */}
          <Text variant="labelCaps" style={styles.sectionHeader}>ACCOUNT</Text>
          <GlassCard variant="obsidianLevel1" style={styles.settingsGroup}>
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.actionLeft}>
                <Icon name="SignOut" size={20} color={OBSIDIAN_COLORS.voltLime} />
                <Text variant="labelInteractive" style={styles.actionText}>Log Out</Text>
              </View>
              <Icon name="CaretRight" size={18} color={OBSIDIAN_COLORS.textSlate} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, styles.borderTop]} onPress={confirmDeleteAccount} activeOpacity={0.7}>
              <View style={styles.actionLeft}>
                <Icon name="Trash" size={20} color={OBSIDIAN_COLORS.coralAccent} />
                <Text variant="labelInteractive" style={[styles.actionText, { color: OBSIDIAN_COLORS.coralAccent }]}>
                  Delete Account
                </Text>
              </View>
              <Icon name="CaretRight" size={18} color={OBSIDIAN_COLORS.textSlate} />
            </TouchableOpacity>
          </GlassCard>

          {/* Build Info */}
          <View style={styles.buildInfo}>
            <Text variant="labelCaps" style={styles.buildText}>IronLog v1.0.0 (Obsidian Kinetic)</Text>
            <Text variant="bodySm" style={styles.buildSub}>Designed with precision for lifters</Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: OBSIDIAN_SPACING.lg,
    borderRadius: OBSIDIAN_RADIUS.xl,
    marginVertical: OBSIDIAN_SPACING.sm,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: OBSIDIAN_SPACING.md,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  userEmail: {
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    color: OBSIDIAN_COLORS.voltLime,
    letterSpacing: 1.5,
    marginTop: OBSIDIAN_SPACING.lg,
    marginBottom: OBSIDIAN_SPACING.xs + 2,
    marginLeft: OBSIDIAN_SPACING.xs,
  },
  settingsGroup: {
    borderRadius: OBSIDIAN_RADIUS.xl,
    paddingHorizontal: OBSIDIAN_SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.md,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
  },
  rowTextCol: {
    flex: 1,
    paddingRight: OBSIDIAN_SPACING.sm,
  },
  rowTitle: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  rowSub: {
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 2,
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    padding: 2,
  },
  segBtn: {
    paddingVertical: 4,
    paddingHorizontal: OBSIDIAN_SPACING.sm + 2,
    borderRadius: OBSIDIAN_RADIUS.full,
  },
  segBtnActive: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
  },
  segText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: OBSIDIAN_COLORS.textSlate,
    fontSize: 12,
  },
  segTextActive: {
    color: OBSIDIAN_COLORS.onPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: OBSIDIAN_SPACING.md,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: OBSIDIAN_SPACING.sm,
  },
  actionText: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  buildInfo: {
    alignItems: 'center',
    marginTop: OBSIDIAN_SPACING.xl,
    gap: 4,
  },
  buildText: {
    color: OBSIDIAN_COLORS.textSlate,
  },
  buildSub: {
    color: OBSIDIAN_COLORS.textSlate,
    fontSize: 11,
  },
});

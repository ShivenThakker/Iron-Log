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
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
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
  const userEmail = user?.email || 'lifter@ironlog.app';

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
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="CaretLeft" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text variant="h2" style={styles.title}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* User Profile Card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={{ fontSize: 32 }}>🦁</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text variant="h3" style={styles.userName}>{userName}</Text>
              <Text variant="caption" style={styles.userEmail}>{userEmail}</Text>
              <Badge label="Iron Member" variant="gold" style={{ marginTop: 6 }} />
            </View>
          </GlassCard>

          {/* Preferences Section */}
          <Text variant="caption" style={styles.sectionHeader}>WORKOUT PREFERENCES</Text>
          <GlassCard style={styles.settingsGroup}>
            {/* Weight Unit */}
            <View style={styles.row}>
              <View>
                <Text variant="body" style={styles.rowTitle}>Weight Unit</Text>
                <Text variant="caption" style={styles.rowSub}>Metric (kg) vs Imperial (lbs)</Text>
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
              <View>
                <Text variant="body" style={styles.rowTitle}>Default Rest Timer</Text>
                <Text variant="caption" style={styles.rowSub}>Auto-countdown between sets</Text>
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
          <Text variant="caption" style={styles.sectionHeader}>EXPERIENCE & FEEDBACK</Text>
          <GlassCard style={styles.settingsGroup}>
            <View style={styles.row}>
              <View>
                <Text variant="body" style={styles.rowTitle}>Push Notifications</Text>
                <Text variant="caption" style={styles.rowSub}>Streak reminders and workout prompts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.dark.bgInput, true: COLORS.dark.accentRed }}
              />
            </View>

            <View style={[styles.row, styles.borderTop]}>
              <View>
                <Text variant="body" style={styles.rowTitle}>Haptic Feedback</Text>
                <Text variant="caption" style={styles.rowSub}>Vibration on set check & PR milestones</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: COLORS.dark.bgInput, true: COLORS.dark.accentRed }}
              />
            </View>
          </GlassCard>

          {/* Account Actions */}
          <Text variant="caption" style={styles.sectionHeader}>ACCOUNT</Text>
          <GlassCard style={styles.settingsGroup}>
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <View style={styles.actionLeft}>
                <Icon name="SignOut" size={20} color={COLORS.dark.accentGold} />
                <Text variant="body" style={styles.actionText}>Log Out</Text>
              </View>
              <Icon name="CaretRight" size={18} color={COLORS.dark.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, styles.borderTop]} onPress={confirmDeleteAccount}>
              <View style={styles.actionLeft}>
                <Icon name="Trash" size={20} color={COLORS.dark.destructive} />
                <Text variant="body" style={[styles.actionText, { color: COLORS.dark.destructive }]}>
                  Delete Account
                </Text>
              </View>
              <Icon name="CaretRight" size={18} color={COLORS.dark.textSecondary} />
            </TouchableOpacity>
          </GlassCard>

          {/* Build Info */}
          <View style={styles.buildInfo}>
            <Text variant="caption" style={styles.buildText}>IronLog Version 1.0.0 (Build 42)</Text>
            <Text variant="caption" style={styles.buildSub}>Designed with precision for lifters</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  title: {
    color: COLORS.dark.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 60,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginVertical: SPACING.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.dark.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.dark.textPrimary,
  },
  userEmail: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    color: COLORS.dark.accentGold,
    letterSpacing: 1.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  settingsGroup: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowTitle: {
    color: COLORS.dark.textPrimary,
  },
  rowSub: {
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.bgInput,
    borderRadius: RADIUS.full,
    padding: 2,
  },
  segBtn: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  segBtnActive: {
    backgroundColor: COLORS.dark.accentRed,
  },
  segText: {
    color: COLORS.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  segTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionText: {
    color: COLORS.dark.textPrimary,
    fontWeight: '600',
  },
  buildInfo: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: 2,
  },
  buildText: {
    color: COLORS.dark.textSecondary,
  },
  buildSub: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
  },
});

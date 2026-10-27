import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';

export interface DayActivity {
  count: number;
  volume_kg: number;
  duration_min: number;
}

export interface ActivityData {
  year: number;
  totalWorkouts: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  days: Record<string, DayActivity>;
}

interface WorkoutActivityGridProps {
  data?: ActivityData | null;
  year?: number;
  theme?: 'default' | 'obsidian';
}

const SQUARE_SIZE = 11;
const SQUARE_GAP = 3;
const WEEK_COL_WIDTH = SQUARE_SIZE + SQUARE_GAP;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export const WorkoutActivityGrid: React.FC<WorkoutActivityGridProps> = ({
  data,
  year = new Date().getFullYear(),
}) => {
  const scrollRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Build 53 weeks x 7 days grid matrix
  const { weeks, monthPositions } = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const dayOfWeek = (startDate.getDay() + 6) % 7; // Monday = 0
    const cursor = new Date(year, 0, 1 - dayOfWeek);

    const generatedWeeks: Array<
      Array<{
        dateStr: string;
        date: Date;
        inYear: boolean;
        isToday: boolean;
        isFuture: boolean;
        activity?: DayActivity;
      }>
    > = [];

    const mPositions: { name: string; weekIndex: number }[] = [];
    let lastRecordedMonth = -1;

    for (let w = 0; w < 53; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(cursor);
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const dateNum = currentDate.getDate();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;

        const inYear = y === year;
        const isToday = dateStr === todayStr;
        const isFuture = currentDate > new Date();

        if (inYear && m !== lastRecordedMonth && dateNum <= 7) {
          mPositions.push({ name: MONTH_NAMES[m], weekIndex: w });
          lastRecordedMonth = m;
        }

        weekDays.push({
          dateStr,
          date: currentDate,
          inYear,
          isToday,
          isFuture,
          activity: inYear ? data?.days?.[dateStr] : undefined,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
      generatedWeeks.push(weekDays);
    }

    return { weeks: generatedWeeks, monthPositions: mPositions };
  }, [year, data, todayStr]);

  // Find active week for auto-scroll
  useEffect(() => {
    const todayWeek = weeks.findIndex((w) => w.some((d) => d.isToday));
    if (todayWeek > 8 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: Math.max(0, (todayWeek - 5) * WEEK_COL_WIDTH),
          animated: true,
        });
      }, 300);
    }
  }, [weeks]);

  // Selected Day Details
  const selectedInfo = useMemo(() => {
    const targetDateStr = selectedDate || (data?.days?.[todayStr] ? todayStr : null);
    if (!targetDateStr) return null;

    const act = data?.days?.[targetDateStr];
    const parts = targetDateStr.split('-');
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      dateStr: targetDateStr,
      formattedDate,
      hasWorkout: Boolean(act && act.count > 0),
      count: act?.count || 0,
      volumeKg: act?.volume_kg || 0,
      durationMin: act?.duration_min || 0,
    };
  }, [selectedDate, data, todayStr]);

  const getSquareColor = (cell: {
    inYear: boolean;
    isFuture: boolean;
    activity?: DayActivity;
  }) => {
    if (!cell.inYear) return 'transparent';
    if (!cell.activity || cell.activity.count <= 0) {
      return cell.isFuture ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.07)';
    }

    const { count, volume_kg } = cell.activity;
    if (count >= 2 || volume_kg >= 7000) {
      return OBSIDIAN_COLORS.voltLime;
    }
    if (volume_kg >= 4000) {
      return 'rgba(204, 255, 0, 0.75)';
    }
    return 'rgba(204, 255, 0, 0.45)';
  };

  return (
    <View style={styles.container}>
      {/* Stat Bar Header */}
      <View style={styles.headerStatsRow}>
        <View style={styles.statPill}>
          <Icon name="CalendarCheck" size={14} color={OBSIDIAN_COLORS.voltLime} />
          <Text style={styles.statPillNum}>{data?.totalWorkouts ?? 0}</Text>
          <Text style={styles.statPillLabel} numberOfLines={1}>Workouts</Text>
        </View>

        <View style={styles.streakPill}>
          <Icon name="Fire" size={14} color={OBSIDIAN_COLORS.coralAccent} />
          <Text style={styles.streakPillNum}>{data?.currentStreak ?? 0}d</Text>
          <Text style={styles.statPillLabel} numberOfLines={1}>Streak</Text>
        </View>

        <View style={styles.streakPill}>
          <Icon name="Trophy" size={14} color={OBSIDIAN_COLORS.cyanAccent} />
          <Text style={styles.streakPillNum}>{data?.activeDays ?? 0}d</Text>
          <Text style={styles.statPillLabel} numberOfLines={1}>Active</Text>
        </View>
      </View>

      {/* Contribution Grid Container */}
      <View style={styles.gridOuterCard}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Day of Week Labels Column */}
          <View style={styles.dayLabelsCol}>
            <View style={{ height: 16 }} />
            {DAY_LABELS.map((label, idx) => (
              <View key={`day-${idx}`} style={styles.dayLabelRow}>
                <Text style={styles.dayLabelText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Weeks Matrix */}
          <View>
            {/* Months Header Row */}
            <View style={styles.monthsRow}>
              {monthPositions.map((m, idx) => (
                <Text
                  key={`${m.name}-${idx}`}
                  style={[
                    styles.monthText,
                    { left: m.weekIndex * WEEK_COL_WIDTH },
                  ]}
                >
                  {m.name}
                </Text>
              ))}
            </View>

            {/* Week Columns */}
            <View style={styles.matrixRow}>
              {weeks.map((week, wIdx) => (
                <View key={`week-${wIdx}`} style={styles.weekCol}>
                  {week.map((cell) => {
                    const isSelected = selectedDate === cell.dateStr;
                    const bg = getSquareColor(cell);

                    return (
                      <TouchableOpacity
                        key={cell.dateStr}
                        activeOpacity={0.7}
                        disabled={!cell.inYear}
                        onPress={() => {
                          setSelectedDate(cell.dateStr);
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                        }}
                        style={[
                          styles.square,
                          { backgroundColor: bg },
                          cell.isToday && styles.todaySquare,
                          isSelected && styles.selectedSquare,
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Selected Day Tooltip Banner */}
        {selectedInfo ? (
          <View style={styles.tooltipCard}>
            <View style={styles.tooltipLeft}>
              <View
                style={[
                  styles.tooltipDot,
                  {
                    backgroundColor: selectedInfo.hasWorkout
                      ? OBSIDIAN_COLORS.voltLime
                      : OBSIDIAN_COLORS.borderGhost,
                  },
                ]}
              />
              <View>
                <Text style={styles.tooltipDate}>{selectedInfo.formattedDate}</Text>
                <Text style={styles.tooltipStatus}>
                  {selectedInfo.hasWorkout
                    ? `${selectedInfo.count} session completed • ${selectedInfo.durationMin}m duration`
                    : 'Rest Day (No logged workouts)'}
                </Text>
              </View>
            </View>

            {selectedInfo.hasWorkout && (
              <View style={styles.tooltipVolumeBadge}>
                <Text style={styles.tooltipVolumeVal}>
                  {selectedInfo.volumeKg.toLocaleString()}
                </Text>
                <Text style={styles.tooltipVolumeUnit}>KG</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tooltipCard}>
            <Text style={styles.tooltipHint}>Tap any square to view daily workout stats</Text>
          </View>
        )}

        {/* Legend Row */}
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Less</Text>
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(255, 255, 255, 0.07)' }]} />
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(204, 255, 0, 0.45)' }]} />
          <View style={[styles.legendSquare, { backgroundColor: 'rgba(204, 255, 0, 0.75)' }]} />
          <View style={[styles.legendSquare, { backgroundColor: OBSIDIAN_COLORS.voltLime }]} />
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    gap: 5,
    overflow: 'hidden',
  },
  statPillNum: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.voltLime,
  },
  statPillLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: OBSIDIAN_COLORS.textMuted,
  },
  streakPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: OBSIDIAN_RADIUS.md,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
    gap: 5,
    overflow: 'hidden',
  },
  streakPillNum: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  gridOuterCard: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollContent: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingRight: 10,
  },
  dayLabelsCol: {
    width: 24,
    marginRight: 6,
    justifyContent: 'flex-start',
  },
  dayLabelRow: {
    height: SQUARE_SIZE,
    marginBottom: SQUARE_GAP,
    justifyContent: 'center',
  },
  dayLabelText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 8,
    color: OBSIDIAN_COLORS.textSlate,
    textAlign: 'right',
  },
  monthsRow: {
    height: 16,
    position: 'relative',
    marginBottom: 4,
  },
  monthText: {
    position: 'absolute',
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 9,
    color: OBSIDIAN_COLORS.textMuted,
  },
  matrixRow: {
    flexDirection: 'row',
  },
  weekCol: {
    marginRight: SQUARE_GAP,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 2.5,
    marginBottom: SQUARE_GAP,
  },
  todaySquare: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  selectedSquare: {
    borderColor: OBSIDIAN_COLORS.cyanAccent,
    borderWidth: 1.5,
    shadowColor: OBSIDIAN_COLORS.cyanAccent,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  tooltipCard: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    borderRadius: OBSIDIAN_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  tooltipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipDate: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textWhite,
  },
  tooltipStatus: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 10,
    color: OBSIDIAN_COLORS.textMuted,
    marginTop: 1,
  },
  tooltipHint: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: OBSIDIAN_COLORS.textSlate,
    textAlign: 'center',
    width: '100%',
  },
  tooltipVolumeBadge: {
    alignItems: 'flex-end',
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: OBSIDIAN_RADIUS.sm,
  },
  tooltipVolumeVal: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: OBSIDIAN_COLORS.voltLime,
  },
  tooltipVolumeUnit: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: OBSIDIAN_COLORS.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
    paddingRight: 4,
  },
  legendText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 9,
    color: OBSIDIAN_COLORS.textSlate,
  },
  legendSquare: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { Icon } from './Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
} from '@/constants/tokens';

export interface DatePickerCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({
  selectedDate,
  onSelectDate,
  maxDate = new Date(),
  minDate,
}) => {
  // Current viewing month/year initialized to selectedDate
  const [viewDate, setViewDate] = useState<Date>(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(now);
  };

  const monthTitle = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Normalize reference dates to midnight for exact comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedMidnight = new Date(selectedDate);
  selectedMidnight.setHours(0, 0, 0, 0);

  const maxMidnight = maxDate ? new Date(maxDate) : null;
  if (maxMidnight) maxMidnight.setHours(23, 59, 59, 999);

  const minMidnight = minDate ? new Date(minDate) : null;
  if (minMidnight) minMidnight.setHours(0, 0, 0, 0);

  const isCurrentOrFutureMonth = maxMidnight
    ? year > maxMidnight.getFullYear() ||
      (year === maxMidnight.getFullYear() && month >= maxMidnight.getMonth())
    : false;

  return (
    <View style={styles.container}>
      {/* Month Navigation Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={handlePrevMonth}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="CaretLeft" size={18} color={OBSIDIAN_COLORS.textWhite} weight="bold" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.monthTitleBtn}
          activeOpacity={0.8}
          onPress={handleToday}
        >
          <Text style={styles.monthTitleText}>{monthTitle}</Text>
          <Text style={styles.todayHint}>Tap for Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, isCurrentOrFutureMonth && styles.navBtnDisabled]}
          onPress={handleNextMonth}
          disabled={isCurrentOrFutureMonth}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name="CaretRight"
            size={18}
            color={isCurrentOrFutureMonth ? OBSIDIAN_COLORS.textMuted : OBSIDIAN_COLORS.textWhite}
            weight="bold"
          />
        </TouchableOpacity>
      </View>

      {/* Day of Week Labels */}
      <View style={styles.daysOfWeekRow}>
        {DAYS_OF_WEEK.map((d, idx) => (
          <View key={idx} style={styles.dayOfWeekCol}>
            <Text style={styles.dayOfWeekText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {/* Leading offset days */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.dayCell} />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const cellDate = new Date(year, month, dayNum);
          cellDate.setHours(0, 0, 0, 0);

          const isSelected = cellDate.getTime() === selectedMidnight.getTime();
          const isToday = cellDate.getTime() === today.getTime();
          const isFuture = maxMidnight ? cellDate.getTime() > maxMidnight.getTime() : false;
          const isPastMin = minMidnight ? cellDate.getTime() < minMidnight.getTime() : false;
          const isDisabled = isFuture || isPastMin;

          return (
            <View key={`day-${dayNum}`} style={styles.dayCell}>
              <TouchableOpacity
                style={[
                  styles.dayBtn,
                  isSelected && styles.dayBtnSelected,
                  isToday && !isSelected && styles.dayBtnToday,
                  isDisabled && styles.dayBtnDisabled,
                ]}
                disabled={isDisabled}
                activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }
                  onSelectDate(new Date(year, month, dayNum, 12, 0, 0));
                }}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                    isDisabled && styles.dayTextDisabled,
                  ]}
                >
                  {dayNum}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderRadius: OBSIDIAN_RADIUS.lg,
    padding: OBSIDIAN_SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: OBSIDIAN_SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: OBSIDIAN_RADIUS.md,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  monthTitleBtn: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: OBSIDIAN_COLORS.textWhite,
    letterSpacing: 0.2,
  },
  todayHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: OBSIDIAN_COLORS.voltLime,
    marginTop: 1,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 6,
    marginBottom: 6,
  },
  dayOfWeekCol: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    color: OBSIDIAN_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnSelected: {
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    ...Platform.select({
      ios: {
        shadowColor: OBSIDIAN_COLORS.voltLime,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dayBtnToday: {
    borderWidth: 1.5,
    borderColor: OBSIDIAN_COLORS.voltLime,
  },
  dayBtnDisabled: {
    opacity: 0.22,
  },
  dayText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 13,
    color: OBSIDIAN_COLORS.textWhite,
  },
  dayTextSelected: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#000000',
  },
  dayTextToday: {
    color: OBSIDIAN_COLORS.voltLime,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  dayTextDisabled: {
    color: OBSIDIAN_COLORS.textMuted,
  },
});

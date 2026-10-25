import { describe, it, expect } from 'vitest';
import { getEffectiveStreak } from '../src/repositories/session.repository';

describe('getEffectiveStreak', () => {
  it('returns 0 for null or undefined streak', () => {
    expect(getEffectiveStreak(null)).toBe(0);
    expect(getEffectiveStreak(undefined)).toBe(0);
  });

  it('returns current streak if active today', () => {
    const today = new Date();
    const streak = {
      current_streak: 5,
      last_active_date: today,
      grace_used_this_week: false,
    };
    expect(getEffectiveStreak(streak)).toBe(5);
  });

  it('returns current streak if active yesterday (1 day diff)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const streak = {
      current_streak: 7,
      last_active_date: yesterday,
      grace_used_this_week: false,
    };
    expect(getEffectiveStreak(streak)).toBe(7);
  });

  it('preserves streak if 2 days inactive but grace is available', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const streak = {
      current_streak: 10,
      last_active_date: twoDaysAgo,
      grace_used_this_week: false,
    };
    expect(getEffectiveStreak(streak)).toBe(10);
  });

  it('expires streak (returns 0) if 2 days inactive and grace was already used', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const streak = {
      current_streak: 10,
      last_active_date: twoDaysAgo,
      grace_used_this_week: true,
    };
    expect(getEffectiveStreak(streak)).toBe(0);
  });

  it('expires streak (returns 0) if inactive for 3 or more days', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const streak = {
      current_streak: 12,
      last_active_date: threeDaysAgo,
      grace_used_this_week: false,
    };
    expect(getEffectiveStreak(streak)).toBe(0);
  });
});

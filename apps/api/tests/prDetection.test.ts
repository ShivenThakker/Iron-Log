import { describe, it, expect } from 'vitest';
import { calculateEstimated1RM } from '../src/services/prDetection';

describe('calculateEstimated1RM', () => {
  it('calculates 1RM accurately for single rep', () => {
    // 100 * (1 + 1/30) = 103.33
    const result = calculateEstimated1RM(100, 1);
    expect(result).toBeCloseTo(103.33, 1);
  });

  it('calculates 1RM accurately for 5 reps', () => {
    // 100 * (1 + 5/30) = 116.67
    const result = calculateEstimated1RM(100, 5);
    expect(result).toBeCloseTo(116.67, 1);
  });

  it('calculates 1RM accurately for 10 reps', () => {
    // 80 * (1 + 10/30) = 106.67
    const result = calculateEstimated1RM(80, 10);
    expect(result).toBeCloseTo(106.67, 1);
  });

  it('handles zero weight correctly', () => {
    const result = calculateEstimated1RM(0, 10);
    expect(result).toBe(0);
  });
});

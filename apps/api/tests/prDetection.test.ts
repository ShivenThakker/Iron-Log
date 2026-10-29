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

  it('correctly compares whether a set exceeds existing PR', () => {
    // Current PR: 45kg x 8 reps -> 45 * (1 + 8/30) = 57.0 kg
    const existingPR = calculateEstimated1RM(45, 8);
    // New set: 45kg x 10 reps -> 45 * (1 + 10/30) = 60.0 kg (Beat PR!)
    const improvedSet = calculateEstimated1RM(45, 10);
    // Equal or lower set: 45kg x 6 reps -> 54.0 kg (Did not beat PR)
    const lowerSet = calculateEstimated1RM(45, 6);

    expect(improvedSet).toBeGreaterThan(existingPR);
    expect(lowerSet).toBeLessThan(existingPR);
  });

  it('correctly identifies heavier weight with fewer reps as higher 1RM', () => {
    // 50kg x 6 reps -> 50 * (1 + 6/30) = 60.0 kg
    const heavierLoad = calculateEstimated1RM(50, 6);
    // 40kg x 12 reps -> 40 * (1 + 12/30) = 56.0 kg
    const lighterLoad = calculateEstimated1RM(40, 12);

    expect(heavierLoad).toBeGreaterThan(lighterLoad);
  });
});

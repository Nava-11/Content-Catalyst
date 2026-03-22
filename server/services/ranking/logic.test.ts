import { describe, it, expect } from 'vitest';
import { sampleBeta, getRiskMultiplier } from './logic';

describe('sampleBeta', () => {
  it('should return a value around the mean', () => {
    // alpha=10, beta=10 -> mean=0.5
    // variance = 100 / (400 * 21) = 0.0119
    // stdDev approx 0.1
    const alpha = 10;
    const beta = 10;
    const samples = Array.from({ length: 100 }, () => sampleBeta(alpha, beta));
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    
    expect(avg).toBeGreaterThan(0.3);
    expect(avg).toBeLessThan(0.7);
  });

  it('should handle small counts (high exploration)', () => {
    const alpha = 1;
    const beta = 1;
    const samples = Array.from({ length: 100 }, () => sampleBeta(alpha, beta));
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    
    // With alpha=1, beta=1, mean=0.5, variance=1/12=0.0833, stdDev=0.288
    // noise = [-0.144, 0.144], so max range is ~0.288
    expect(max - min).toBeGreaterThan(0.1); // Should have SOME variation
    expect(max - min).toBeLessThan(0.4);
  });
});

describe('getRiskMultiplier', () => {
  it('should return 1.0 for moderate profile', () => {
    expect(getRiskMultiplier('moderate', 'tutorial')).toBe(1.0);
    expect(getRiskMultiplier('moderate', 'challenge')).toBe(1.0);
  });

  it('should boost safe formats for conservative profile', () => {
    expect(getRiskMultiplier('conservative', 'tutorial')).toBe(1.2);
    expect(getRiskMultiplier('conservative', 'listicle')).toBe(1.2);
  });

  it('should penalize risky formats for conservative profile', () => {
    expect(getRiskMultiplier('conservative', 'challenge')).toBe(0.6);
    expect(getRiskMultiplier('conservative', 'rant')).toBe(0.6);
  });

  it('should boost risky formats for aggressive profile', () => {
    expect(getRiskMultiplier('aggressive', 'challenge')).toBe(1.3);
    expect(getRiskMultiplier('aggressive', 'experiment')).toBe(1.3);
  });

  it('should slightly penalize safe formats for aggressive profile', () => {
    expect(getRiskMultiplier('aggressive', 'tutorial')).toBe(0.9);
  });

  it('should handle null/unknown profiles', () => {
    expect(getRiskMultiplier(null, 'tutorial')).toBe(1.0);
    expect(getRiskMultiplier('unknown', 'tutorial')).toBe(1.0);
  });
});

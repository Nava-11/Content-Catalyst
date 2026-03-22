import { describe, it, expect } from 'vitest';
import { formatNumber } from './utils';

describe('formatNumber', () => {
  it('should format thousands as k', () => {
    expect(formatNumber(1500)).toBe('1.5k');
    expect(formatNumber(10000)).toBe('10.0k');
  });

  it('should format millions as M', () => {
    expect(formatNumber(2500000)).toBe('2.5M');
  });

  it('should return the same number if less than 1000', () => {
    expect(formatNumber(500)).toBe('500');
  });
});

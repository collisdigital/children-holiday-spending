import { describe, it, expect } from 'vitest';
import { convertToGBP } from './currency';

describe('Currency Utils', () => {
  it('converts MAD to GBP correctly', () => {
    // 100 MAD * 0.08 = 8 GBP
    expect(convertToGBP(100)).toBe(8);
  });
});


import { describe, it, expect } from 'vitest';
import { formatCurrency } from './currency';

describe('Currency Utils', () => {
  it('formats currency correctly', () => {
    // Note: Behavior depends on locale. Assuming en-GB.
    // However, exact output (e.g., non-breaking space vs space) can be tricky.
    // We'll check it contains the symbol and value.
    const result = formatCurrency(100, 'GBP');
    expect(result).toContain('£');
    expect(result).toContain('100');
  });

  it('defaults to EUR', () => {
    const result = formatCurrency(50);
    expect(result).toContain('€');
    expect(result).toContain('50');
  });
});

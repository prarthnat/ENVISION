import { describe, it, expect } from 'vitest';
import { formatDateOnly, getDeadlineCountdown, isOverdue } from '../lib/date';

describe('Frontend Date Utilities', () => {
  it('formats YYYY-MM-DD date without timezone conversion', () => {
    expect(formatDateOnly('2026-08-15')).toBe('Aug 15, 2026');
    expect(formatDateOnly('2026-01-01')).toBe('Jan 1, 2026');
    expect(formatDateOnly('2026-12-31')).toBe('Dec 31, 2026');
  });

  it('handles null or empty deadline gracefully', () => {
    expect(formatDateOnly(null)).toBe('No deadline');
    expect(formatDateOnly(undefined)).toBe('No deadline');
    expect(formatDateOnly('')).toBe('No deadline');
  });

  it('correctly calculates overdue status based on date string', () => {
    // A past date relative to 2026-10-27
    expect(isOverdue('2026-05-15')).toBe(true);
    // A future date
    expect(isOverdue('2099-01-01')).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });

  it('describes deadline countdown without timezone drift', () => {
    expect(getDeadlineCountdown(null).label).toBe('No deadline');
    expect(getDeadlineCountdown('2099-01-01').overdue).toBe(false);
    expect(getDeadlineCountdown('2020-01-01').overdue).toBe(true);
    expect(getDeadlineCountdown('2020-01-01').label).toMatch(/overdue/);
  });
});

/**
 * Formats a YYYY-MM-DD date string safely without timezone conversion.
 * e.g., "2026-08-15" -> "Aug 15, 2026"
 */
export function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No deadline';

  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const [yearStr, monthStr, dayStr] = parts;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  // Use UTC to prevent any local browser timezone displacement
  const date = new Date(Date.UTC(year, month, day));
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Checks if a deadline is overdue relative to today (ignoring hours/minutes).
 */
export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return dateStr < todayStr;
}

export interface DeadlineCountdown {
  days: number | null;
  label: string;
  overdue: boolean;
}

/**
 * Human-readable countdown from today (UTC date-only) to a YYYY-MM-DD deadline.
 */
export function getDeadlineCountdown(dateStr: string | null | undefined): DeadlineCountdown {
  if (!dateStr) {
    return { days: null, label: 'No deadline', overdue: false };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const deadlineMs = Date.parse(`${dateStr}T00:00:00.000Z`);
  const todayMs = Date.parse(`${todayStr}T00:00:00.000Z`);
  if (Number.isNaN(deadlineMs) || Number.isNaN(todayMs)) {
    return { days: null, label: dateStr, overdue: false };
  }

  const days = Math.round((deadlineMs - todayMs) / 86_400_000);
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      days,
      label: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
      overdue: true,
    };
  }
  if (days === 0) {
    return { days, label: 'Due today', overdue: false };
  }
  return {
    days,
    label: `${days} day${days === 1 ? '' : 's'} remaining`,
    overdue: false,
  };
}

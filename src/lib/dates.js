import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  addDays,
  isAfter,
  parseISO,
  startOfDay,
} from 'date-fns';

export function getWeekLabel(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return `Week of ${format(start, 'MMM d')}`;
}

export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  return format(d, 'MMM d');
}

export function isPeriodExpired(periodEnd) {
  if (!periodEnd) return false;
  return isAfter(new Date(), parseISO(periodEnd));
}

export function getPeriodLabel(start, end) {
  if (!start || !end) return null;
  return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d')}`;
}

export function getNextPeriodStart(currentEnd, periodType) {
  if (!currentEnd || !periodType) return null;
  const base = parseISO(currentEnd);
  // New period starts the day after the old period ends
  return format(addDays(base, 1), 'yyyy-MM-dd');
}

export function getNextPeriodEnd(currentEnd, periodType) {
  if (!currentEnd || !periodType) return null;
  const base = parseISO(currentEnd);
  if (periodType === 'weekly') {
    return format(endOfWeek(addWeeks(base, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }
  if (periodType === 'monthly') {
    return format(endOfMonth(addMonths(base, 1)), 'yyyy-MM-dd');
  }
  return null; // custom periods don't auto-advance
}

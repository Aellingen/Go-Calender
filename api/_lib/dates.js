import { addDays, addWeeks, addMonths, endOfWeek, endOfMonth, parseISO, format, isAfter, startOfDay } from 'date-fns';

export function isPeriodExpired(periodEnd) {
  if (!periodEnd) return false;
  return isAfter(startOfDay(new Date()), parseISO(periodEnd));
}

export function getNextPeriodStart(currentEnd) {
  if (!currentEnd) return null;
  return format(addDays(parseISO(currentEnd), 1), 'yyyy-MM-dd');
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
  return null;
}

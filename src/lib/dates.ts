import { format, subDays } from 'date-fns';

export function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function lastNDays(n: number, from = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => isoDate(subDays(from, n - 1 - i)));
}

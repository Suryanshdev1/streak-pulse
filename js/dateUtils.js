import { APP_START_DATE } from './config.js';

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday ... 6 = Saturday
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getTodayDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateStr(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateToStr(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDate(dateStr, offsetDays) {
  const dateObj = parseDateStr(dateStr);
  dateObj.setDate(dateObj.getDate() + offsetDays);
  return formatDateToStr(dateObj);
}

export function clampDate(dateStr) {
  const today = getTodayDateStr();
  if (!dateStr || dateStr < APP_START_DATE) return APP_START_DATE;
  if (dateStr > today) return today;
  return dateStr;
}

export function formatDisplayDate(dateStr) {
  const today = getTodayDateStr();
  const yesterday = shiftDate(today, -1);
  const dateObj = parseDateStr(dateStr);

  const formatted = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (dateStr === today) return `${formatted} (Today)`;
  if (dateStr === yesterday) return `${formatted} (Yesterday)`;
  return formatted;
}

// ---- Day-specific task helpers ----

export function getWeekday(dateStr) {
  return parseDateStr(dateStr).getDay();
}

// A task with no days set counts as "every day"
export function isScheduledOn(days, dateStr) {
  if (!Array.isArray(days) || days.length === 0) return true;
  return days.includes(getWeekday(dateStr));
}

// "" for every day, otherwise "Weekdays", "Weekends" or "Mon, Wed, Fri"
export function formatDaysLabel(days) {
  if (!Array.isArray(days) || days.length === 0 || days.length >= 7) return '';
  const set = new Set(days);
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return 'Weekdays';
  if (set.size === 2 && set.has(0) && set.has(6)) return 'Weekends';
  return DAY_ORDER.filter((d) => set.has(d)).map((d) => DAY_NAMES[d]).join(', ');
}

// ---- Multi-date board helpers ----

export const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

// "26 NOVEMBER 2026"
export function formatDateHeading(dateStr) {
  const d = parseDateStr(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function getRangeStart(today, daysBack) {
  const start = shiftDate(today, -daysBack);
  return start < APP_START_DATE ? APP_START_DATE : start;
}

// Every date from (today - daysBack) to (today + daysAhead), oldest first
export function getDateRange(today, daysBack, daysAhead) {
  const end = shiftDate(today, daysAhead);
  const out = [];
  let cursor = getRangeStart(today, daysBack);
  while (cursor <= end) {
    out.push(cursor);
    cursor = shiftDate(cursor, 1);
  }
  return out;
}
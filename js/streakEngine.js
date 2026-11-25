import { APP_START_DATE } from './config.js';
import { shiftDate, isScheduledOn } from './dateUtils.js';

// True if any scheduled day sits strictly between `from` and `to`
function hasScheduledDayBetween(from, to, days) {
  let cursor = shiftDate(from, 1);
  while (cursor < to) {
    if (isScheduledOn(days, cursor)) return true;
    cursor = shiftDate(cursor, 1);
  }
  return false;
}

export function calculateStreak(completedDates = {}, referenceDateStr, days) {
  const validDates = Object.keys(completedDates)
    .filter((d) => completedDates[d] === true && d >= APP_START_DATE)
    .sort();

  const totalCompleted = validDates.length;
  if (totalCompleted === 0) {
    return { currentStreak: 0, bestStreak: 0, totalCompleted: 0 };
  }

  // Current streak: walk back from the reference date.
  // Days the task isn't scheduled on are skipped, not counted as misses.
  // If today is scheduled but not ticked yet, the streak is still alive.
  let currentStreak = 0;
  let cursor = referenceDateStr;
  if (completedDates[cursor] !== true && isScheduledOn(days, cursor)) {
    cursor = shiftDate(cursor, -1);
  }
  while (cursor >= APP_START_DATE) {
    if (completedDates[cursor] === true) {
      currentStreak++;
    } else if (isScheduledOn(days, cursor)) {
      break;
    }
    cursor = shiftDate(cursor, -1);
  }

  // Best streak: longest run of completions with no scheduled day missed in between
  let bestStreak = 0;
  let run = 0;
  let prevDate = null;

  for (const dateStr of validDates) {
    if (prevDate && !hasScheduledDayBetween(prevDate, dateStr, days)) {
      run++;
    } else {
      run = 1;
    }
    if (run > bestStreak) bestStreak = run;
    prevDate = dateStr;
  }

  return { currentStreak, bestStreak, totalCompleted };
}
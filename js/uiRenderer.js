import { APP_START_DATE } from './config.js';
import {
  getTodayDateStr,
  getDateRange,
  getRangeStart,
  formatDateHeading,
  formatDaysLabel,
  isScheduledOn,
  getWeekday,
  DAY_NAMES
} from './dateUtils.js';
import { calculateStreak, getNextGoal } from './streakEngine.js';

const els = {
  authScreen: document.getElementById('auth-screen'),
  appShell: document.getElementById('app-shell'),
  userAvatar: document.getElementById('user-avatar'),
  statCompleted: document.getElementById('stat-completed'),
  statRate: document.getElementById('stat-rate'),
  statTopStreak: document.getElementById('stat-top-streak'),
  loadingIndicator: document.getElementById('loading-indicator'),
  emptyState: document.getElementById('empty-state'),
  streakSection: document.getElementById('streak-section'),
  streakList: document.getElementById('streak-list'),
  datesSection: document.getElementById('dates-section'),
  dateList: document.getElementById('date-list'),
  loadEarlierBtn: document.getElementById('load-earlier-btn'),
  toastContainer: document.getElementById('toast-container')
};

export function renderAuthState(user) {
  if (user) {
    els.authScreen.classList.add('hidden');
    els.appShell.classList.remove('hidden');
    els.userAvatar.src =
      user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=User';
    els.userAvatar.alt = user.user_metadata?.full_name || 'User';
  } else {
    els.authScreen.classList.remove('hidden');
    els.appShell.classList.add('hidden');
  }
}

export function renderApp(state) {
  const today = getTodayDateStr();

  if (state.isLoading) {
    els.loadingIndicator.classList.remove('hidden');
    els.emptyState.classList.add('hidden');
    els.streakSection.classList.add('hidden');
    els.datesSection.classList.add('hidden');
    return;
  }
  els.loadingIndicator.classList.add('hidden');

  if (state.tasks.length === 0) {
    els.emptyState.classList.remove('hidden');
    els.streakSection.classList.add('hidden');
    els.datesSection.classList.add('hidden');
    els.streakList.innerHTML = '';
    els.dateList.innerHTML = '';
    updateStats(0, 0, 0);
    return;
  }

  els.emptyState.classList.add('hidden');
  els.streakSection.classList.remove('hidden');
  els.datesSection.classList.remove('hidden');

  // Streaks are always measured up to today
  const streaks = new Map();
  let topStreak = 0;
  for (const task of state.tasks) {
    const result = calculateStreak(task.completedDates, today, task.days);
    streaks.set(task.id, result);
    if (result.currentStreak > topStreak) topStreak = result.currentStreak;
  }

  els.streakList.innerHTML = state.tasks
    .map((task) => renderStreakRow(task, streaks.get(task.id)))
    .join('');

  const dates = getDateRange(today, state.daysBack, state.daysAhead);
  els.dateList.innerHTML = dates.map((d) => renderDateCard(d, today, state.tasks)).join('');

  els.loadEarlierBtn.classList.toggle(
    'hidden',
    getRangeStart(today, state.daysBack) <= APP_START_DATE
  );

  const scheduledToday = state.tasks.filter((t) => isScheduledOn(t.days, today));
  const doneToday = scheduledToday.filter((t) => t.completedDates[today]).length;
  updateStats(doneToday, scheduledToday.length, topStreak);
}

function renderStreakRow(task, { currentStreak, bestStreak }) {
  const goal = getNextGoal(currentStreak);
  let pct = Math.min(100, (currentStreak / goal) * 100);
  if (currentStreak > 0) pct = Math.max(pct, 8);
  const daysLabel = formatDaysLabel(task.days);
  const title = escapeHtml(task.title);

  return `
    <article class="streak-row" data-id="${task.id}">
      <div class="streak-info">
        <span class="task-title">${title}</span>
        ${
          task.category || daysLabel
            ? `<div class="task-tags">
                ${task.category ? `<span class="task-category">${escapeHtml(task.category)}</span>` : ''}
                ${daysLabel ? `<span class="task-days">${escapeHtml(daysLabel)}</span>` : ''}
              </div>`
            : ''
        }
      </div>
      <div class="streak-bar-col">
        <div class="streak-bar" role="progressbar" aria-label="Streak for ${title}"
             aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${currentStreak}">
          <div class="streak-fill" style="width:${pct}%"></div>
          <span class="streak-bar-label">🔥 ${currentStreak}d</span>
        </div>
        <div class="streak-meta">
          <span>Best ${bestStreak}d</span>
          <span>Next goal ${goal}d</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-icon" data-action="edit" data-id="${task.id}" title="Edit" aria-label="Edit ${title}">✏️</button>
        <button class="btn btn-icon btn-delete" data-action="delete" data-id="${task.id}" title="Delete" aria-label="Delete ${title}">🗑️</button>
      </div>
    </article>
  `;
}

function renderDateCard(dateStr, today, tasks) {
  const scheduled = tasks.filter((t) => isScheduledOn(t.days, dateStr));
  const done = scheduled.filter((t) => t.completedDates[dateStr]).length;
  const isToday = dateStr === today;
  const isFuture = dateStr > today;
  const allDone = scheduled.length > 0 && done === scheduled.length;

  const classes = [
    'date-card',
    isToday ? 'is-today' : '',
    isFuture ? 'is-future' : '',
    allDone ? 'is-complete' : ''
  ].join(' ');

  const cells = scheduled
    .map((task) => {
      const checked = Boolean(task.completedDates[dateStr]);
      return `
        <label class="day-task ${checked ? 'done' : ''}">
          <input type="checkbox" class="task-checkbox"
                 data-action="toggle" data-id="${task.id}" data-date="${dateStr}"
                 ${checked ? 'checked' : ''} ${isFuture ? 'disabled' : ''} />
          <span class="day-task-title">${escapeHtml(task.title)}</span>
        </label>
      `;
    })
    .join('');

  return `
    <section class="${classes}">
      <header class="date-head">
        <div class="date-head-main">
          <h3 class="date-title">${formatDateHeading(dateStr)}</h3>
          <span class="pill">${DAY_NAMES[getWeekday(dateStr)].toUpperCase()}</span>
          ${isToday ? '<span class="pill pill-today">TODAY</span>' : ''}
        </div>
        ${scheduled.length ? `<span class="date-progress">${done}/${scheduled.length}</span>` : ''}
      </header>
      ${
        scheduled.length
          ? `<div class="day-tasks">${cells}</div>`
          : '<p class="day-empty">Nothing scheduled</p>'
      }
    </section>
  `;
}

function updateStats(completed, total, topStreak) {
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  els.statCompleted.textContent = `${completed} / ${total}`;
  els.statRate.textContent = `${rate}%`;
  els.statTopStreak.textContent = `🔥 ${topStreak}d`;
}

export function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  els.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2600);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
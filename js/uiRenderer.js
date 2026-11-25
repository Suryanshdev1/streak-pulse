import { APP_START_DATE } from './config.js';
import {
  getTodayDateStr,
  formatDisplayDate,
  isScheduledOn,
  formatDaysLabel
} from './dateUtils.js';
import { calculateStreak } from './streakEngine.js';

const els = {
  authScreen: document.getElementById('auth-screen'),
  appShell: document.getElementById('app-shell'),
  userAvatar: document.getElementById('user-avatar'),
  datePicker: document.getElementById('date-picker'),
  dateDisplayLabel: document.getElementById('date-display-label'),
  prevDayBtn: document.getElementById('prev-day-btn'),
  nextDayBtn: document.getElementById('next-day-btn'),
  statCompleted: document.getElementById('stat-completed'),
  statRate: document.getElementById('stat-rate'),
  statTopStreak: document.getElementById('stat-top-streak'),
  loadingIndicator: document.getElementById('loading-indicator'),
  taskList: document.getElementById('task-list'),
  emptyState: document.getElementById('empty-state'),
  toastContainer: document.getElementById('toast-container')
};

const EMPTY_NO_TASKS =
  '<p>No tasks yet. Click <strong>+ Add Task</strong> to start building your streaks!</p>';
const EMPTY_NOTHING_TODAY =
  '<p>Nothing scheduled for this day. Tasks set for other days show up on theirs.</p>';

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
  els.datePicker.min = APP_START_DATE;
  els.datePicker.max = today;
  els.datePicker.value = state.activeDate;
  els.dateDisplayLabel.textContent = formatDisplayDate(state.activeDate);

  els.prevDayBtn.disabled = state.activeDate <= APP_START_DATE;
  els.nextDayBtn.disabled = state.activeDate >= today;

  if (state.isLoading) {
    els.loadingIndicator.classList.remove('hidden');
    els.taskList.innerHTML = '';
    els.emptyState.classList.add('hidden');
    return;
  }

  els.loadingIndicator.classList.add('hidden');

  if (state.tasks.length === 0) {
    els.taskList.innerHTML = '';
    els.emptyState.innerHTML = EMPTY_NO_TASKS;
    els.emptyState.classList.remove('hidden');
    updateStats(0, 0, 0);
    return;
  }

  // Streaks for every task (top streak spans all tasks, not just today's)
  const streaks = new Map();
  let topStreak = 0;
  for (const task of state.tasks) {
    const result = calculateStreak(task.completedDates, state.activeDate, task.days);
    streaks.set(task.id, result);
    if (result.currentStreak > topStreak) topStreak = result.currentStreak;
  }

  // Only tasks scheduled for the selected weekday are shown
  const visibleTasks = state.tasks.filter((t) => isScheduledOn(t.days, state.activeDate));

  if (visibleTasks.length === 0) {
    els.taskList.innerHTML = '';
    els.emptyState.innerHTML = EMPTY_NOTHING_TODAY;
    els.emptyState.classList.remove('hidden');
    updateStats(0, 0, topStreak);
    return;
  }

  els.emptyState.classList.add('hidden');

  let completedCount = 0;

  els.taskList.innerHTML = visibleTasks
    .map((task) => {
      const isChecked = Boolean(task.completedDates[state.activeDate]);
      if (isChecked) completedCount++;

      const { currentStreak, bestStreak } = streaks.get(task.id);
      const daysLabel = formatDaysLabel(task.days);

      return `
        <article class="task-card ${isChecked ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-left">
            <input
              type="checkbox"
              class="task-checkbox"
              data-action="toggle"
              data-id="${task.id}"
              ${isChecked ? 'checked' : ''}
            />
            <div class="task-info">
              <span class="task-title">${escapeHtml(task.title)}</span>
              ${
                task.category || daysLabel
                  ? `<div class="task-tags">
                      ${task.category ? `<span class="task-category">${escapeHtml(task.category)}</span>` : ''}
                      ${daysLabel ? `<span class="task-days">${escapeHtml(daysLabel)}</span>` : ''}
                    </div>`
                  : ''
              }
            </div>
          </div>
          <div class="task-right">
            <span class="streak-badge" title="Best Streak: ${bestStreak} days">
              🔥 ${currentStreak}d
            </span>
            <div class="task-actions">
              <button class="btn btn-icon" data-action="edit" data-id="${task.id}" title="Edit">✏️</button>
              <button class="btn btn-icon btn-delete" data-action="delete" data-id="${task.id}" title="Delete">🗑️</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  updateStats(completedCount, visibleTasks.length, topStreak);
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
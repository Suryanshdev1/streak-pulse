import {
  fetchUserTasks,
  createTask,
  updateTaskDetails,
  removeTask,
  setTaskCompletion
} from './supabaseService.js';
import { getTodayDateStr, isScheduledOn, formatDaysLabel } from './dateUtils.js';
import {
  state,
  setTasks,
  setLoading,
  showEarlierDays,
  addTaskToState,
  updateTaskInState,
  removeTaskFromState,
  toggleTaskDateInState
} from './state.js';
import { renderApp, showToast } from './uiRenderer.js';
import { openAddModal, openEditModal, initModalEvents } from './modalHandler.js';

// Direct App Boot (No Login)
async function bootApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.querySelector('.user-menu')?.classList.add('hidden');

  setLoading(true);
  renderApp(state);
  try {
    const tasks = await fetchUserTasks();
    setTasks(tasks);
  } catch (err) {
    console.error(err);
    showToast('Failed to load tasks from Supabase.');
  } finally {
    setLoading(false);
    renderApp(state);
  }
}

// Keep the board current: when midnight passes, "today" moves on by itself
let lastToday = getTodayDateStr();
function checkDayRollover() {
  const now = getTodayDateStr();
  if (now !== lastToday) {
    lastToday = now;
    renderApp(state);
  }
}
setInterval(checkDayRollover, 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDayRollover();
});

// Older dates
document.getElementById('load-earlier-btn').addEventListener('click', () => {
  showEarlierDays();
  renderApp(state);
});

// Add / Edit Modal Events
document.getElementById('open-add-modal-btn').addEventListener('click', openAddModal);

initModalEvents(async ({ id, title, category, days }) => {
  try {
    if (id) {
      await updateTaskDetails(id, { title, category, days });
      updateTaskInState(id, { title, category, days });
      showToast('Task updated');
    } else {
      const newTask = await createTask({ title, category, days });
      addTaskToState(newTask);
      showToast('Task added');
    }
    renderApp(state);
    if (!isScheduledOn(days, getTodayDateStr())) {
      showToast(`Saved. It appears on ${formatDaysLabel(days)}.`);
    }
  } catch (err) {
    console.error(err);
    showToast(`Could not save task: ${err?.message || 'unknown error'}`);
  }
});

// Ticking a task on any date
document.getElementById('date-list').addEventListener('change', async (e) => {
  const box = e.target.closest('[data-action="toggle"]');
  if (!box) return;

  const { id: taskId, date } = box.dataset;
  if (date > getTodayDateStr()) return;

  const isChecked = box.checked;
  toggleTaskDateInState(taskId, date, isChecked);
  renderApp(state);

  const task = state.tasks.find((t) => t.id === taskId);
  try {
    await setTaskCompletion(taskId, task.completedDates);
  } catch (err) {
    console.error(err);
    toggleTaskDateInState(taskId, date, !isChecked);
    renderApp(state);
    showToast('Sync failed. Reverted checkbox.');
  }
});

// Edit / Delete from the streak section
document.getElementById('streak-list').addEventListener('click', async (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const { action, id: taskId } = target.dataset;

  if (action === 'edit') {
    const task = state.tasks.find((t) => t.id === taskId);
    if (task) openEditModal(task);
  } else if (action === 'delete') {
    if (!confirm('Delete this task and its entire streak history?')) return;
    try {
      await removeTask(taskId);
      removeTaskFromState(taskId);
      renderApp(state);
      showToast('Task deleted');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete task.');
    }
  }
});

bootApp();
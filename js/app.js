import {
  fetchUserTasks,
  createTask,
  updateTaskDetails,
  removeTask,
  setTaskCompletion
} from './supabaseService.js';
import { getTodayDateStr, shiftDate } from './dateUtils.js';
import {
  state,
  setActiveDate,
  setTasks,
  setLoading,
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

// Date Navigation Events
document.getElementById('prev-day-btn').addEventListener('click', () => {
  setActiveDate(shiftDate(state.activeDate, -1));
  renderApp(state);
});

document.getElementById('next-day-btn').addEventListener('click', () => {
  setActiveDate(shiftDate(state.activeDate, 1));
  renderApp(state);
});

document.getElementById('today-btn').addEventListener('click', () => {
  setActiveDate(getTodayDateStr());
  renderApp(state);
});

document.getElementById('date-picker').addEventListener('change', (e) => {
  setActiveDate(e.target.value);
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
  } catch (err) {
    console.error(err);
    showToast('Could not save task.');
  }
});

// Task List Delegation (Checkbox, Edit, Delete)
document.getElementById('task-list').addEventListener('click', async (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const taskId = target.dataset.id;

  if (action === 'toggle') {
    const isChecked = target.checked;
    toggleTaskDateInState(taskId, state.activeDate, isChecked);
    renderApp(state);

    const task = state.tasks.find((t) => t.id === taskId);
    try {
      await setTaskCompletion(taskId, task.completedDates);
    } catch (err) {
      console.error(err);
      toggleTaskDateInState(taskId, state.activeDate, !isChecked);
      renderApp(state);
      showToast('Sync failed. Reverted checkbox.');
    }
  } else if (action === 'edit') {
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
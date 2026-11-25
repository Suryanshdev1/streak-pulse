import { getTodayDateStr, clampDate } from './dateUtils.js';

export const state = {
  user: null,
  activeDate: getTodayDateStr(),
  tasks: [],
  isLoading: false
};

export function setUser(user) {
  state.user = user;
}

export function setActiveDate(dateStr) {
  state.activeDate = clampDate(dateStr);
}

export function setTasks(tasks) {
  state.tasks = tasks;
}

export function setLoading(flag) {
  state.isLoading = flag;
}

export function addTaskToState(task) {
  state.tasks.push(task);
}

export function updateTaskInState(taskId, updates) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (task) {
    Object.assign(task, updates);
  }
}

export function removeTaskFromState(taskId) {
  state.tasks = state.tasks.filter((t) => t.id !== taskId);
}

export function toggleTaskDateInState(taskId, dateStr, isCompleted) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  if (isCompleted) {
    task.completedDates[dateStr] = true;
  } else {
    delete task.completedDates[dateStr];
  }
}
export const state = {
  user: null,
  tasks: [],
  isLoading: false,
  daysBack: 2,   // past days shown above today
  daysAhead: 6   // upcoming days shown below today
};

export function setUser(user) {
  state.user = user;
}

export function setTasks(tasks) {
  state.tasks = tasks;
}

export function setLoading(flag) {
  state.isLoading = flag;
}

export function showEarlierDays(count = 7) {
  state.daysBack += count;
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
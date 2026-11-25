import { ALL_DAYS } from './dateUtils.js';

const modal = document.getElementById('task-modal');
const modalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form');
const taskIdInput = document.getElementById('task-id-input');
const taskTitleInput = document.getElementById('task-title-input');
const taskCategoryInput = document.getElementById('task-category-input');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const dayChecks = [...document.querySelectorAll('#day-picker input[name="days"]')];
const dayError = document.getElementById('day-error');

const PRESETS = {
  all: ALL_DAYS,
  weekdays: [1, 2, 3, 4, 5],
  weekends: [0, 6]
};

function setDays(days) {
  const set = new Set(days);
  dayChecks.forEach((box) => {
    box.checked = set.has(Number(box.value));
  });
  dayError.classList.add('hidden');
}

function getSelectedDays() {
  return dayChecks
    .filter((box) => box.checked)
    .map((box) => Number(box.value))
    .sort((a, b) => a - b);
}

export function openAddModal() {
  modalTitle.textContent = 'Add New Task';
  taskIdInput.value = '';
  taskTitleInput.value = '';
  taskCategoryInput.value = '';
  setDays(ALL_DAYS);
  modal.classList.remove('hidden');
  taskTitleInput.focus();
}

export function openEditModal(task) {
  modalTitle.textContent = 'Edit Task';
  taskIdInput.value = task.id;
  taskTitleInput.value = task.title;
  taskCategoryInput.value = task.category || '';
  setDays(task.days && task.days.length ? task.days : ALL_DAYS);
  modal.classList.remove('hidden');
  taskTitleInput.focus();
}

export function closeModal() {
  modal.classList.add('hidden');
  taskForm.reset();
  dayError.classList.add('hidden');
}

export function initModalEvents(onSubmitCallback) {
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Quick presets: Every day / Weekdays / Weekends
  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => setDays(PRESETS[btn.dataset.preset]));
  });

  dayChecks.forEach((box) => {
    box.addEventListener('change', () => dayError.classList.add('hidden'));
  });

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = taskIdInput.value.trim();
    const title = taskTitleInput.value.trim();
    const category = taskCategoryInput.value.trim();
    const days = getSelectedDays();
    if (!title) return;

    if (days.length === 0) {
      dayError.classList.remove('hidden');
      return;
    }

    await onSubmitCallback({ id, title, category, days });
    closeModal();
  });
}
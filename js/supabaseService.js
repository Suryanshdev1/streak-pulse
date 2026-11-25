import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { ALL_DAYS } from './dateUtils.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category || '',
    completedDates: row.completed_dates || {},
    days: row.days_of_week && row.days_of_week.length ? row.days_of_week : ALL_DAYS
  };
}

export function onAuthChange(callback) {
  supabase.auth.getSession().then(({ data }) => {
    callback(data.session?.user || null);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  return () => listener.subscription.unsubscribe();
}

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) throw error;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchUserTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(mapRow);
}

export async function createTask({ title, category, days = ALL_DAYS }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: title.trim(),
      category: category.trim(),
      completed_dates: {},
      days_of_week: days
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateTaskDetails(taskId, { title, category, days }) {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: title.trim(),
      category: category.trim(),
      days_of_week: days
    })
    .eq('id', taskId);

  if (error) throw error;
}

export async function removeTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function setTaskCompletion(taskId, completedDates) {
  const { error } = await supabase
    .from('tasks')
    .update({ completed_dates: completedDates })
    .eq('id', taskId);

  if (error) throw error;
}
export type HabitFrequency = 'daily' | 'weekdays' | 'custom';
export type Theme = 'light' | 'dark' | 'system';

export type Habit = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  frequency: HabitFrequency;
  targetPerWeek: number;
  createdAt: string;
  archived: boolean;
};

export type CheckIn = { habitId: string; date: string; completed: boolean };
export type UserPreferences = { theme: Theme; weekStartsOn: 0 | 1 };
export type GardenData = { habits: Habit[]; checkIns: CheckIn[]; preferences: UserPreferences };

const STORAGE_KEY = 'habit-garden-data-v1';
const colors = ['#d39b5c', '#cf7c78', '#769b82', '#8a83b7', '#d0a94e', '#5c98a7'];

const seed: GardenData = {
  habits: [
    { id: 'seed-water', name: 'Drink water', description: 'A glass before the first scroll.', color: '#5c98a7', icon: 'droplet', frequency: 'daily', targetPerWeek: 7, createdAt: new Date().toISOString(), archived: false },
    { id: 'seed-outside', name: 'Step outside', description: 'Notice the weather, even for a minute.', color: '#d39b5c', icon: 'sun', frequency: 'daily', targetPerWeek: 7, createdAt: new Date().toISOString(), archived: false },
    { id: 'seed-pages', name: 'Read a few pages', description: 'Let someone else’s words in.', color: '#8a83b7', icon: 'book-open', frequency: 'custom', targetPerWeek: 4, createdAt: new Date().toISOString(), archived: false },
  ],
  checkIns: [],
  preferences: { theme: 'light', weekStartsOn: 1 },
};

function read(): GardenData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as GardenData;
  } catch { /* recover with fresh local garden */ }
  return seed;
}

export function loadGarden(): GardenData {
  const data = read();
  if (!data.habits.length && !localStorage.getItem(STORAGE_KEY)) saveGarden(seed);
  return data;
}

export function saveGarden(data: GardenData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function colorForIndex(index: number) { return colors[index % colors.length]; }

export function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function weekKeys(anchor = new Date(), startsOn: 0 | 1 = 1) {
  const date = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const day = date.getDay();
  const distance = (day - startsOn + 7) % 7;
  date.setDate(date.getDate() - distance);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(date);
    current.setDate(date.getDate() + index);
    return localDate(current);
  });
}

export function isScheduled(habit: Habit, key: string) {
  const day = dateFromKey(key).getDay();
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekdays') return day > 0 && day < 6;
  return true;
}

export function checkIsComplete(checkIns: CheckIn[], habitId: string, date: string) {
  return checkIns.some((item) => item.habitId === habitId && item.date === date && item.completed);
}

export function currentStreak(habit: Habit, checkIns: CheckIn[]) {
  let cursor = new Date();
  let streak = 0;
  if (!checkIsComplete(checkIns, habit.id, localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (checkIsComplete(checkIns, habit.id, localDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function exportGarden(data: GardenData) {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString(), version: 1 }, null, 2);
}
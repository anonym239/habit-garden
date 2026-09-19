import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Habit = {
  id: string;
  name: string;
  note: string;
  color: string;
  target: number;
  createdAt: string;
};

type HabitState = {
  habits: Habit[];
  checkIns: Record<string, string[]>;
  hydrated: boolean;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  deleteHabit: (id: string) => void;
  toggleToday: (id: string) => void;
  reset: () => void;
};

const STORAGE_KEY = 'habit-garden-v1';
const todayKey = () => new Date().toISOString().slice(0, 10);

const starterHabits: Habit[] = [
  { id: 'water', name: 'Wasser trinken', note: 'Ein Glas direkt nach dem Aufstehen', color: '#3E7C59', target: 7, createdAt: new Date().toISOString() },
  { id: 'walk', name: 'Spaziergang', note: 'Mindestens zehn Minuten draußen', color: '#D58B50', target: 5, createdAt: new Date().toISOString() },
  { id: 'read', name: 'Lesen', note: 'Ein paar ruhige Seiten am Abend', color: '#6F79A8', target: 4, createdAt: new Date().toISOString() },
];

const HabitContext = createContext<HabitState | null>(null);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(starterHabits);
  const [checkIns, setCheckIns] = useState<Record<string, string[]>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as { habits: Habit[]; checkIns: Record<string, string[]> };
        setHabits(parsed.habits);
        setCheckIns(parsed.checkIns);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, checkIns }));
  }, [habits, checkIns, hydrated]);

  const value = useMemo<HabitState>(() => ({
    habits,
    checkIns,
    hydrated,
    addHabit: (input) => setHabits((current) => [...current, { ...input, id: `${Date.now()}${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() }]),
    updateHabit: (id, input) => setHabits((current) => current.map((habit) => habit.id === id ? { ...habit, ...input } : habit)),
    deleteHabit: (id) => {
      setHabits((current) => current.filter((habit) => habit.id !== id));
      setCheckIns((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    toggleToday: (id) => setCheckIns((current) => {
      const today = todayKey();
      const dates = current[id] ?? [];
      return { ...current, [id]: dates.includes(today) ? dates.filter((date) => date !== today) : [...dates, today] };
    }),
    reset: () => {
      setHabits([]);
      setCheckIns({});
    },
  }), [habits, checkIns, hydrated]);

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabits() {
  const value = useContext(HabitContext);
  if (!value) throw new Error('useHabits must be used within HabitProvider');
  return value;
}

export function getStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
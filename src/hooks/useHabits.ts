import { useState, useEffect } from 'react';
import { Habit, Category, HabitRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const apiFetch = async (endpoint: string, userId: string, options: RequestInit = {}) => {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${text}`);
  }
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON but got ${contentType}: ${text}`);
  }
  return res.json();
};

export function useHabits(userId: string | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [records, setRecords] = useState<HabitRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!userId) {
      setIsLoaded(false);
      setHabits([]);
      setCategories([]);
      setRecords([]);
      return;
    }
    setIsLoaded(false);
    apiFetch('/api/data', userId).then((data) => {
      setCategories(data.categories || []);
      setHabits(data.habits || []);
      setRecords(data.records || []);
      setIsLoaded(true);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setIsLoaded(true);
    });
  }, [userId]);

  // Habit Actions
  const addHabit = async (name: string, frequency: 'daily' | 'weekly' | 'monthly', description?: string, categoryId?: string, reminderTime?: string) => {
    if (!userId) return;
    const newHabit: Habit = {
      id: uuidv4(),
      name,
      description,
      categoryId,
      frequency,
      createdAt: Date.now(),
      reminderTime,
    };
    setHabits([...habits, newHabit]);
    await apiFetch('/api/habits', userId, {
      method: 'POST',
      body: JSON.stringify(newHabit),
    });
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!userId) return;
    const existingHabit = habits.find(h => h.id === id);
    if (!existingHabit) return;
    const updatedHabit = { ...existingHabit, ...updates };
    setHabits(habits.map((h) => (h.id === id ? updatedHabit : h)));
    await apiFetch(`/api/habits/${id}`, userId, {
      method: 'PUT',
      body: JSON.stringify(updatedHabit),
    });
  };

  const deleteHabit = async (id: string) => {
    if (!userId) return;
    setHabits(habits.filter((h) => h.id !== id));
    setRecords(records.filter((r) => r.habitId !== id));
    await apiFetch(`/api/habits/${id}`, userId, { method: 'DELETE' });
  };

  // Category Actions
  const addCategory = async (name: string, color: string) => {
    if (!userId) return;
    const newCategory: Category = {
      id: uuidv4(),
      name,
      color,
    };
    setCategories([...categories, newCategory]);
    await apiFetch('/api/categories', userId, {
      method: 'POST',
      body: JSON.stringify(newCategory),
    });
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!userId) return;
    const existingCategory = categories.find(c => c.id === id);
    if (!existingCategory) return;
    const updatedCategory = { ...existingCategory, ...updates };
    setCategories(categories.map((c) => (c.id === id ? updatedCategory : c)));
    await apiFetch(`/api/categories/${id}`, userId, {
      method: 'PUT',
      body: JSON.stringify(updatedCategory),
    });
  };

  const deleteCategory = async (id: string) => {
    if (!userId) return;
    setCategories(categories.filter((c) => c.id !== id));
    setHabits(habits.map((h) => (h.categoryId === id ? { ...h, categoryId: undefined } : h)));
    await apiFetch(`/api/categories/${id}`, userId, { method: 'DELETE' });
  };

  // Record Actions
  const toggleHabitRecord = async (habitId: string, date: Date) => {
    if (!userId) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingRecordIndex = records.findIndex(
      (r) => r.habitId === habitId && r.date === dateStr
    );

    const isCompleted = existingRecordIndex < 0;

    if (!isCompleted) {
      // Toggle off
      const newRecords = [...records];
      newRecords.splice(existingRecordIndex, 1);
      setRecords(newRecords);
    } else {
      // Toggle on
      setRecords([...records, { habitId, date: dateStr, completed: true }]);
    }

    await apiFetch('/api/records', userId, {
      method: 'POST',
      body: JSON.stringify({ habitId, date: dateStr, completed: isCompleted }),
    });
  };

  const getHabitRecord = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find((r) => r.habitId === habitId && r.date === dateStr);
  };

  return {
    habits,
    categories,
    records,
    addHabit,
    updateHabit,
    deleteHabit,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleHabitRecord,
    getHabitRecord,
    isLoaded
  };
}

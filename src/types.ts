export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface User {
  id: string;
  username: string;
  ntfyTopic?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  frequency?: HabitFrequency;
  createdAt: number;
  reminderTime?: string;
  frequencyTarget?: number;
  position: number;
}

export interface HabitRecord {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

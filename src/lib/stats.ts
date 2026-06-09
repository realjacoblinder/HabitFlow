import {
  parseISO,
  subDays,
  format,
  startOfWeek,
  subWeeks,
  endOfWeek,
  startOfMonth,
  subMonths,
  endOfMonth,
  isAfter,
  isBefore,
  differenceInCalendarDays,
} from 'date-fns';
import { Habit, HabitRecord } from '../types';

// Helper to filter completed records for a specific habit
export function getCompletedDates(records: HabitRecord[], habitId: string): Set<string> {
  const completed = records
    .filter((r) => r.habitId === habitId && r.completed)
    .map((r) => r.date);
  return new Set(completed);
}

// Calculate streak
export function calculateStreak(records: HabitRecord[], habit: Habit): number {
  const completedDates = getCompletedDates(records, habit.id);
  if (completedDates.size === 0) return 0;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterday = subDays(today, 1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

  const freq = habit.frequency || 'daily';
  const target = habit.frequencyTarget || 1;

  if (freq === 'daily') {
    let currentDay = today;
    let currentDayStr = todayStr;

    // If today is not completed, check if yesterday was completed to keep streak alive
    if (!completedDates.has(todayStr)) {
      if (completedDates.has(yesterdayStr)) {
        currentDay = yesterday;
        currentDayStr = yesterdayStr;
      } else {
        return 0; // Streak is broken
      }
    }

    let streak = 0;
    while (completedDates.has(currentDayStr)) {
      streak++;
      currentDay = subDays(currentDay, 1);
      currentDayStr = format(currentDay, 'yyyy-MM-dd');
    }
    return streak;
  }

  if (freq === 'weekly') {
    // Weeks start on Monday
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    // Count completions in a given week interval
    const getWeekCompletions = (weekStart: Date) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      let count = 0;
      completedDates.forEach((dateStr) => {
        const date = parseISO(dateStr);
        if (!isBefore(date, weekStart) && !isAfter(date, weekEnd)) {
          count++;
        }
      });
      return count;
    };

    let activeWeekStart = currentWeekStart;
    let weekCompletions = getWeekCompletions(activeWeekStart);

    // If current week hasn't met the target yet, check if the previous week met the target
    if (weekCompletions < target) {
      const prevWeekStart = subWeeks(currentWeekStart, 1);
      const prevWeekCompletions = getWeekCompletions(prevWeekStart);
      if (prevWeekCompletions >= target) {
        activeWeekStart = prevWeekStart;
        weekCompletions = prevWeekCompletions;
      } else {
        return 0; // Streak broken
      }
    }

    let streak = 0;
    let weekToCheck = activeWeekStart;
    while (getWeekCompletions(weekToCheck) >= target) {
      streak++;
      weekToCheck = subWeeks(weekToCheck, 1);
    }
    return streak;
  }

  if (freq === 'monthly') {
    const currentMonthStart = startOfMonth(today);

    // Count completions in a given month interval
    const getMonthCompletions = (monthStart: Date) => {
      const monthEnd = endOfMonth(monthStart);
      let count = 0;
      completedDates.forEach((dateStr) => {
        const date = parseISO(dateStr);
        if (!isBefore(date, monthStart) && !isAfter(date, monthEnd)) {
          count++;
        }
      });
      return count;
    };

    let activeMonthStart = currentMonthStart;
    let monthCompletions = getMonthCompletions(activeMonthStart);

    // If current month hasn't met the target yet, check if the previous month met the target
    if (monthCompletions < target) {
      const prevMonthStart = subMonths(currentMonthStart, 1);
      const prevMonthCompletions = getMonthCompletions(prevMonthStart);
      if (prevMonthCompletions >= target) {
        activeMonthStart = prevMonthStart;
        monthCompletions = prevMonthCompletions;
      } else {
        return 0; // Streak broken
      }
    }

    let streak = 0;
    let monthToCheck = activeMonthStart;
    while (getMonthCompletions(monthToCheck) >= target) {
      streak++;
      monthToCheck = subMonths(monthToCheck, 1);
    }
    return streak;
  }

  return 0;
}

export interface HabitStats {
  streak: number;
  completionRate: number; // 0 - 100
  completedCount: number;
  expectedCount: number;
  rateText: string;
}

export function calculateHabitStats(records: HabitRecord[], habit: Habit): HabitStats {
  const completedDates = getCompletedDates(records, habit.id);
  const streak = calculateStreak(records, habit);
  const today = new Date();
  const freq = habit.frequency || 'daily';
  const target = habit.frequencyTarget || 1;

  if (freq === 'daily') {
    // Look at last 30 days
    let completedCount = 0;
    const expectedCount = 30;
    for (let i = 0; i < 30; i++) {
      const dayStr = format(subDays(today, i), 'yyyy-MM-dd');
      if (completedDates.has(dayStr)) {
        completedCount++;
      }
    }
    const completionRate = Math.round((completedCount / expectedCount) * 100);
    return {
      streak,
      completionRate,
      completedCount,
      expectedCount,
      rateText: `${completedCount}/${expectedCount} days`,
    };
  }

  if (freq === 'weekly') {
    // Look at last 4 weeks (including current week)
    let completedCount = 0;
    const expectedCount = 4;
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    const getWeekCompletions = (weekStart: Date) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      let count = 0;
      completedDates.forEach((dateStr) => {
        const date = parseISO(dateStr);
        if (!isBefore(date, weekStart) && !isAfter(date, weekEnd)) {
          count++;
        }
      });
      return count;
    };

    for (let i = 0; i < 4; i++) {
      const weekStart = subWeeks(currentWeekStart, i);
      if (getWeekCompletions(weekStart) >= target) {
        completedCount++;
      }
    }
    const completionRate = Math.round((completedCount / expectedCount) * 100);
    return {
      streak,
      completionRate,
      completedCount,
      expectedCount,
      rateText: `${completedCount}/${expectedCount} weeks`,
    };
  }

  if (freq === 'monthly') {
    // Look at last 3 months (including current month)
    let completedCount = 0;
    const expectedCount = 3;
    const currentMonthStart = startOfMonth(today);

    const getMonthCompletions = (monthStart: Date) => {
      const monthEnd = endOfMonth(monthStart);
      let count = 0;
      completedDates.forEach((dateStr) => {
        const date = parseISO(dateStr);
        if (!isBefore(date, monthStart) && !isAfter(date, monthEnd)) {
          count++;
        }
      });
      return count;
    };

    for (let i = 0; i < 3; i++) {
      const monthStart = subMonths(currentMonthStart, i);
      if (getMonthCompletions(monthStart) >= target) {
        completedCount++;
      }
    }
    const completionRate = Math.round((completedCount / expectedCount) * 100);
    return {
      streak,
      completionRate,
      completedCount,
      expectedCount,
      rateText: `${completedCount}/${expectedCount} months`,
    };
  }

  return { streak: 0, completionRate: 0, completedCount: 0, expectedCount: 0, rateText: '' };
}

export interface HeatmapDay {
  date: Date;
  dateStr: string;
  count: number;
  isFuture?: boolean;
}

export function getHeatmapData(records: HabitRecord[], daysToLookBack = 139): HeatmapDay[] {
  const today = new Date();
  // Align start date to the beginning of the week (Monday) and end date to the end of the week (Sunday)
  const rawStartDate = subDays(today, daysToLookBack);
  const startDate = startOfWeek(rawStartDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(today, { weekStartsOn: 1 });
  
  // Calculate total days from startDate to endDate
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
  
  // Map of dateStr -> count of completed habits
  const completedCounts: Record<string, number> = {};
  records.forEach((r) => {
    if (r.completed) {
      completedCounts[r.date] = (completedCounts[r.date] || 0) + 1;
    }
  });

  const heatmapDays: HeatmapDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = subDays(endDate, totalDays - 1 - i); // Chronological order
    const dateStr = format(date, 'yyyy-MM-dd');
    const isFuture = isAfter(date, today);
    heatmapDays.push({
      date,
      dateStr,
      count: isFuture ? 0 : (completedCounts[dateStr] || 0),
      isFuture,
    });
  }

  return heatmapDays;
}

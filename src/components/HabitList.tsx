import React, { useState } from 'react';
import { Habit, Category, HabitRecord } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { format, subDays, isSameDay } from 'date-fns';
import { Trash2, CheckCircle2, Circle, Flame, Trophy, Star, Bell } from 'lucide-react';
import { Badge } from './ui/badge';
import { EditHabitDialog } from './EditHabitDialog';
import { HabitCalendarDialog } from './HabitCalendarDialog';

interface HabitListProps {
  habits: Habit[];
  categories: Category[];
  records: HabitRecord[];
  toggleHabitRecord: (habitId: string, date: Date) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  selectedCategoryId: string | null;
  selectedFrequency: string | null;
}

export function HabitList({ habits, categories, records, toggleHabitRecord, updateHabit, deleteHabit, selectedCategoryId, selectedFrequency }: HabitListProps) {
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

  const filteredHabits = habits.filter((h) => {
    const categoryMatch = selectedCategoryId ? h.categoryId === selectedCategoryId : true;
    const freqMatch = selectedFrequency ? (h.frequency || 'daily') === selectedFrequency : true;
    return categoryMatch && freqMatch;
  });

  const getRecord = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find((r) => r.habitId === habitId && r.date === dateStr);
  };

  const getCategory = (categoryId?: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const calculateStreak = (habitId: string) => {
    let streak = 0;
    let currentDate = today;
    
    let record = getRecord(habitId, currentDate);
    if (record?.completed) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      currentDate = subDays(currentDate, 1);
      record = getRecord(habitId, currentDate);
      if (record?.completed) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        return 0;
      }
    }

    while (true) {
      record = getRecord(habitId, currentDate);
      if (record?.completed) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  if (filteredHabits.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No habits found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredHabits.map((habit) => {
        const category = getCategory(habit.categoryId);
        const streak = calculateStreak(habit.id);
        
        let streakBadgeClass = "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
        let StreakIcon = Flame;
        
        if (streak >= 30) {
          streakBadgeClass = "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.4)]";
          StreakIcon = Trophy;
        } else if (streak >= 7) {
          streakBadgeClass = "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 shadow-[0_0_10px_rgba(234,179,8,0.4)]";
          StreakIcon = Star;
        }

        return (
          <Card key={habit.id} className={`overflow-hidden transition-all duration-300 ${streak >= 30 ? 'border-purple-200 dark:border-purple-800' : streak >= 7 ? 'border-yellow-200 dark:border-yellow-800' : ''}`}>
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{habit.name}</h3>
                      {category && (
                        <Badge variant="outline" style={{ borderColor: category.color, color: category.color }}>
                          {category.name}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="capitalize">
                        {habit.frequency || 'daily'}
                      </Badge>
                      {habit.reminderTime && (
                        <Badge variant="secondary" className="text-muted-foreground">
                          <Bell className="w-3 h-3 mr-1" />
                          {habit.reminderTime}
                        </Badge>
                      )}
                      {streak > 0 && (
                        <Badge variant="secondary" className={`transition-all duration-300 ${streakBadgeClass}`}>
                          <StreakIcon className="w-3 h-3 mr-1" />
                          {streak} {streak === 1 ? 'day' : 'days'}
                        </Badge>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <HabitCalendarDialog habit={habit} records={records} toggleHabitRecord={toggleHabitRecord} />
                    <EditHabitDialog habit={habit} categories={categories} updateHabit={updateHabit} />
                    <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 flex items-center justify-between sm:justify-end gap-2 sm:gap-4 border-t sm:border-t-0 sm:border-l">
                {days.map((day) => {
                  const record = getRecord(habit.id, day);
                  const isToday = isSameDay(day, today);
                  
                  return (
                    <div key={day.toISOString()} className="flex flex-col items-center gap-2">
                      <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {format(day, 'EEE')}
                      </span>
                      <button
                        onClick={() => toggleHabitRecord(habit.id, day)}
                        className={`rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          record?.completed 
                            ? 'text-primary hover:text-primary/80' 
                            : 'text-muted hover:text-muted-foreground'
                        }`}
                      >
                        {record?.completed ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

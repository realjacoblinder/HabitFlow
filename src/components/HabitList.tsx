import React, { useState } from 'react';
import { Habit, Category, HabitRecord } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { format, subDays, isSameDay, isSameWeek, isSameMonth, parseISO, endOfWeek, endOfMonth, differenceInDays, startOfWeek, subWeeks, startOfMonth, subMonths } from 'date-fns';
import { Trash2, CheckCircle2, Circle, Flame, Trophy, Star, Bell, Plus, Check, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
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
  sortMode: 'manual' | 'category' | 'frequency';
  reorderHabits: (orderedHabits: Habit[]) => void;
}

export function HabitList({ habits, categories, records, toggleHabitRecord, updateHabit, deleteHabit, selectedCategoryId, selectedFrequency, sortMode, reorderHabits }: HabitListProps) {
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

  const getRecord = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find((r) => r.habitId === habitId && r.date === dateStr);
  };

  const getCategory = (categoryId?: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const filteredHabits = habits.filter((h) => {
    const categoryMatch = selectedCategoryId ? h.categoryId === selectedCategoryId : true;
    const freqMatch = selectedFrequency ? (h.frequency || 'daily') === selectedFrequency : true;
    return categoryMatch && freqMatch;
  });

  const sortedHabits = [...filteredHabits].sort((a, b) => {
    if (sortMode === 'category') {
      const catA = getCategory(a.categoryId)?.name || '';
      const catB = getCategory(b.categoryId)?.name || '';
      if (catA !== catB) return catA.localeCompare(catB);
      return (a.position || 0) - (b.position || 0);
    }
    if (sortMode === 'frequency') {
      const freqOrder = { daily: 1, weekly: 2, monthly: 3 };
      const valA = freqOrder[a.frequency || 'daily'] || 0;
      const valB = freqOrder[b.frequency || 'daily'] || 0;
      if (valA !== valB) return valA - valB;
      return (a.position || 0) - (b.position || 0);
    }
    return (a.position || 0) - (b.position || 0);
  });

  const moveHabit = (id: string, direction: 'up' | 'down') => {
    const index = sortedHabits.findIndex(h => h.id === id);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sortedHabits.length - 1) return;

    const newHabits = [...sortedHabits];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]];
    
    reorderHabits(newHabits);
  };



  const isPeriodMet = (habitId: string, frequency: string, target: number, date: Date) => {
    const start = frequency === 'weekly' ? startOfWeek(date, { weekStartsOn: 1 }) : startOfMonth(date);
    const end = frequency === 'weekly' ? endOfWeek(date, { weekStartsOn: 1 }) : endOfMonth(date);
    
    return records.filter(r => {
      if (r.habitId !== habitId || !r.completed) return false;
      const [y, m, d] = r.date.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return dateObj >= start && dateObj <= end;
    }).length >= target;
  };

  const calculateStreak = (habit: Habit) => {
    if (!habit.frequency || habit.frequency === 'daily') {
      let streak = 0;
      let currentDate = today;
      
      let record = getRecord(habit.id, currentDate);
      if (record?.completed) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        currentDate = subDays(currentDate, 1);
        record = getRecord(habit.id, currentDate);
        if (record?.completed) {
          streak++;
          currentDate = subDays(currentDate, 1);
        } else {
          return 0;
        }
      }

      while (true) {
        record = getRecord(habit.id, currentDate);
        if (record?.completed) {
          streak++;
          currentDate = subDays(currentDate, 1);
        } else {
          break;
        }
      }
      return streak;
    }

    // Weekly/Monthly Streak
    let streak = 0;
    const target = habit.frequencyTarget || 1;
    const frequency = habit.frequency;
    
    // Check current period
    if (isPeriodMet(habit.id, frequency, target, today)) {
      streak++;
    }

    // Check previous periods
    let checkDate = today;
    while (true) {
      checkDate = frequency === 'weekly' ? subWeeks(checkDate, 1) : subMonths(checkDate, 1);
      if (isPeriodMet(habit.id, frequency, target, checkDate)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (habit: Habit) => {
    if (!habit.frequency || habit.frequency === 'daily') {
      const completedDates = records
        .filter(r => r.habitId === habit.id && r.completed)
        .map(r => {
          const [y, m, d] = r.date.split('-');
          return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        })
        .sort((a, b) => a.getTime() - b.getTime());

      if (completedDates.length === 0) return 0;

      let longest = 1;
      let current = 1;

      for (let i = 1; i < completedDates.length; i++) {
          const diff = differenceInDays(completedDates[i], completedDates[i - 1]);
          if (diff === 1) {
              current++;
              if (current > longest) longest = current;
          } else if (diff > 1) {
              current = 1;
          }
      }
      return longest;
    }

    // Weekly/Monthly longest streak
    const habitRecords = records.filter(r => r.habitId === habit.id && r.completed);
    if (habitRecords.length === 0) return 0;

    const target = habit.frequencyTarget || 1;
    const frequency = habit.frequency;
    
    // Get all unique period start dates with completions
    const periodStarts = new Set<string>();
    habitRecords.forEach(r => {
      const [y, m, d] = r.date.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      const start = frequency === 'weekly' ? startOfWeek(dateObj, { weekStartsOn: 1 }) : startOfMonth(dateObj);
      periodStarts.add(start.toISOString());
    });

    const metPeriods = Array.from(periodStarts)
      .map(iso => new Date(iso))
      .filter(date => isPeriodMet(habit.id, frequency, target, date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (metPeriods.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < metPeriods.length; i++) {
      const prev = metPeriods[i-1];
      const curr = metPeriods[i];
      
      const expectedPrev = frequency === 'weekly' ? subWeeks(curr, 1) : subMonths(curr, 1);
      const isConsecutive = frequency === 'weekly' 
        ? isSameWeek(prev, expectedPrev, { weekStartsOn: 1 })
        : isSameMonth(prev, expectedPrev);

      if (isConsecutive) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }

    return longest;
  };

  if (filteredHabits.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No habits found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {sortedHabits.map((habit, index) => {
        const category = getCategory(habit.categoryId);
        const streak = calculateStreak(habit);
        const longestStreak = calculateLongestStreak(habit);
        
        let hitsThisMonth = 0;
        if (habit.frequency === 'monthly') {
          const habitRecords = records.filter(r => r.habitId === habit.id && r.completed);
          hitsThisMonth = habitRecords.filter(r => {
            const [y, m, d] = r.date.split('-');
            const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            return isSameMonth(dateObj, today);
          }).length;
        }
        
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
                      {habit.frequency === 'monthly' && (
                        <Badge variant="outline" className="text-muted-foreground transition-all duration-300 bg-muted/20">
                          {hitsThisMonth} hits this month
                        </Badge>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {sortMode === 'manual' && !selectedCategoryId && !selectedFrequency && (
                      <div className="flex items-center mr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => moveHabit(habit.id, 'up')}
                          className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === sortedHabits.length - 1}
                          onClick={() => moveHabit(habit.id, 'down')}
                          className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <HabitCalendarDialog habit={habit} records={records} toggleHabitRecord={toggleHabitRecord} category={category} isHeatmap={habit.frequency === 'monthly'} />
                    <EditHabitDialog habit={habit} categories={categories} updateHabit={updateHabit} />
                    <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 flex items-center justify-between sm:justify-end gap-2 sm:gap-4 border-t sm:border-t-0 sm:border-l min-w-[200px]">
                {habit.frequency !== 'daily' && habit.frequencyTarget ? (
                  (() => {
                    const habitRecords = records.filter(r => r.habitId === habit.id && r.completed);
                    const completedCount = habitRecords.filter(r => {
                      const [y, m, d] = r.date.split('-');
                      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                      return habit.frequency === 'weekly' ? isSameWeek(dateObj, today, { weekStartsOn: 1 }) : isSameMonth(dateObj, today);
                    }).length;
                    
                    const isTodayLogged = getRecord(habit.id, today)?.completed;
                    
                    // Ring Math
                    const radius = 24;
                    const stroke = 4;
                    const normalizedRadius = radius - stroke * 2;
                    const circumference = normalizedRadius * 2 * Math.PI;
                    const percentage = Math.min((completedCount / habit.frequencyTarget) * 100, 100);
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;

                    // Days Left Math
                    const targetDate = habit.frequency === 'weekly' 
                      ? endOfWeek(today, { weekStartsOn: 1 }) 
                      : endOfMonth(today);
                    // Add 1 because differenceInDays floors to midnight. So today against endOfWeek(today) evaluates cleanly.
                    const daysLeft = differenceInDays(targetDate, today) + 1;
                    
                    let daysLeftColor = 'text-green-600 dark:text-green-400';
                    if (daysLeft <= 3 && percentage < 100) daysLeftColor = 'text-amber-500';
                    if (daysLeft === 1 && percentage < 100) daysLeftColor = 'text-red-500 animate-pulse';
                    if (percentage >= 100) daysLeftColor = 'text-muted-foreground';

                    const streakStatsBox = (
                      <div className="flex flex-col items-center justify-center sm:border-r sm:pr-4 sm:mr-2">
                        <div className={`flex flex-col items-center justify-center ${streak > 0 ? streakBadgeClass : 'bg-muted/30 text-muted-foreground'} min-w-[60px] p-2 rounded-lg transition-all`}>
                          <StreakIcon className={`w-5 h-5 ${streak > 0 ? '' : 'opacity-30'}`} />
                          <span className="text-xl font-bold leading-tight mt-0.5">{streak}</span>
                          <span className="text-[9px] uppercase font-bold tracking-tighter opacity-70">
                            {habit.frequency === 'weekly' ? (streak === 1 ? 'Week' : 'Weeks') : habit.frequency === 'monthly' ? (streak === 1 ? 'Month' : 'Months') : (streak === 1 ? 'Day' : 'Days')}
                          </span>
                        </div>
                        {longestStreak > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground/60 whitespace-nowrap">
                            <Trophy className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-medium">Best: {longestStreak}</span>
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <div className="flex flex-row items-center justify-center gap-4 w-full sm:w-auto">
                        {streakStatsBox}
                        
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center">
                              <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                                <circle
                                  stroke="currentColor"
                                  fill="transparent"
                                  strokeWidth={stroke}
                                  r={normalizedRadius}
                                  cx={radius}
                                  cy={radius}
                                  className="text-muted-foreground/20"
                                />
                                <circle
                                  stroke="currentColor"
                                  fill="transparent"
                                  strokeWidth={stroke}
                                  strokeDasharray={circumference + ' ' + circumference}
                                  style={{ strokeDashoffset }}
                                  strokeLinecap="round"
                                  r={normalizedRadius}
                                  cx={radius}
                                  cy={radius}
                                  className={`${percentage >= 100 ? 'text-primary' : category?.color ? '' : 'text-primary'} transition-all duration-1000 ease-in-out`}
                                  {...(category?.color && percentage < 100 ? { stroke: category.color } : {})}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[13px] font-bold leading-none translate-y-[2px]">{completedCount}</span>
                                <span className="text-[9px] text-muted-foreground leading-none border-t border-muted/50 pt-[1px] mt-[1px]">{habit.frequencyTarget}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleHabitRecord(habit.id, today)}
                              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:scale-105 active:scale-95 ${
                                isTodayLogged 
                                  ? 'bg-primary/20 text-primary' 
                                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                              }`}
                              title={isTodayLogged ? "Un-mark today" : "Mark today"}
                            >
                              {isTodayLogged ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </button>
                          </div>
                          
                          <div className="flex items-center">
                             <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/60 ${daysLeftColor}`}>
                               {percentage >= 100 ? 'Goal Met!' : `${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left`}
                             </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex flex-col items-center justify-center border-r pr-4 mr-2">
                      <div className={`flex flex-col items-center justify-center ${streak > 0 ? streakBadgeClass : 'bg-muted/30 text-muted-foreground'} min-w-[60px] p-2 rounded-lg transition-all`}>
                        <StreakIcon className={`w-5 h-5 ${streak > 0 ? '' : 'opacity-30'}`} />
                        <span className="text-xl font-bold leading-tight mt-0.5">{streak}</span>
                        <span className="text-[9px] uppercase font-bold tracking-tighter opacity-70">Days</span>
                      </div>
                      {longestStreak > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-muted-foreground/60 whitespace-nowrap">
                          <Trophy className="w-2.5 h-2.5" />
                          <span className="text-[10px] font-medium">Best: {longestStreak}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
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
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

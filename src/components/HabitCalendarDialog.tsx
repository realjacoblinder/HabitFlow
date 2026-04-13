import React, { useState } from 'react';
import { Habit, HabitRecord, Category } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { cn } from '../lib/utils';

interface HabitCalendarDialogProps {
  habit: Habit;
  records: HabitRecord[];
  toggleHabitRecord: (habitId: string, date: Date) => void;
  category?: Category;
  isHeatmap?: boolean;
}

export function HabitCalendarDialog({ habit, records, toggleHabitRecord, category, isHeatmap }: HabitCalendarDialogProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getRecord = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find((r) => r.habitId === habit.id && r.date === dateStr);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" title="View Calendar" />}>
        <CalendarIcon className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{habit.name} - History</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold">{format(currentMonth, dateFormat)}</h2>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const record = getRecord(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isDayToday = isToday(day);
              const isCompleted = record?.completed;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => toggleHabitRecord(habit.id, day)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center text-sm transition-colors relative",
                    isHeatmap ? "rounded-sm border border-transparent shadow-[0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : "rounded-md",
                    !isCurrentMonth && "text-muted-foreground/30 opacity-30",
                    isCurrentMonth && !isCompleted && (isHeatmap ? "bg-muted/60 hover:bg-muted" : "hover:bg-muted text-foreground"),
                    isCompleted && (category?.color 
                      ? (isHeatmap ? "hover:brightness-110" : "text-white font-medium hover:opacity-90") 
                      : (isHeatmap ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90 font-medium")),
                    isDayToday && !isCompleted && "border-2 border-primary text-primary font-bold"
                  )}
                  {...(isCompleted && category?.color ? { style: { backgroundColor: category.color } } : {})}
                  title={format(day, 'MMM d, yyyy')}
                >
                  {isHeatmap ? null : <span>{format(day, 'd')}</span>}
                  {!isHeatmap && isCompleted && <Check className="h-3 w-3 absolute bottom-1 opacity-70" />}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

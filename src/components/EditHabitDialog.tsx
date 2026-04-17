import React, { useState, useEffect } from 'react';
import { Category, Habit } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Edit2 } from 'lucide-react';

interface EditHabitDialogProps {
  habit: Habit;
  categories: Category[];
  updateHabit: (id: string, updates: Partial<Habit>) => void;
}

export function EditHabitDialog({ habit, categories, updateHabit }: EditHabitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description || '');
  const [categoryId, setCategoryId] = useState<string>(habit.categoryId || 'none');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(habit.frequency || 'daily');
  const [frequencyTarget, setFrequencyTarget] = useState<number | ''>(habit.frequencyTarget || '');
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || '');

  useEffect(() => {
    if (isOpen) {
      setName(habit.name);
      setDescription(habit.description || '');
      setCategoryId(habit.categoryId || 'none');
      setFrequency(habit.frequency || 'daily');
      setFrequencyTarget(habit.frequencyTarget || '');
      setReminderTime(habit.reminderTime || '');
    }
  }, [isOpen, habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      updateHabit(habit.id, {
        name: name.trim(),
        frequency,
        frequencyTarget: typeof frequencyTarget === 'number' ? frequencyTarget : undefined,
        description: description.trim() || undefined,
        categoryId: categoryId === 'none' ? undefined : categoryId,
        reminderTime: reminderTime || undefined,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" />}>
        <Edit2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-habit-name-${habit.id}`}>Habit Name</Label>
            <Input
              id={`edit-habit-name-${habit.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Read 10 pages"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-habit-desc-${habit.id}`}>Description (Optional)</Label>
            <Input
              id={`edit-habit-desc-${habit.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Non-fiction books"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-frequency-${habit.id}`}>Frequency</Label>
            <Select value={frequency} onValueChange={(val: any) => {
              setFrequency(val);
              if (val === 'daily') setFrequencyTarget('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {frequency !== 'daily' && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor={`edit-frequency-target-[id]`}>Target Frequency (Days/{frequency === 'weekly' ? 'Week' : 'Month'})</Label>
              <Input
                id={`edit-frequency-target-${habit.id}`}
                type="number"
                min="1"
                max={frequency === 'weekly' ? 7 : 31}
                value={frequencyTarget}
                onChange={(e) => setFrequencyTarget(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder={`e.g., target amount of days...`}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-category-${habit.id}`}>Category</Label>
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val || 'none')}>
              <SelectTrigger>
                <SelectValue>
                  {categoryId === 'none' ? 'No Category' : categories.find(c => c.id === categoryId)?.name || 'Select a category'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-reminder-time-${habit.id}`}>Reminder Time (Optional)</Label>
            <Input
              id={`edit-reminder-time-${habit.id}`}
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
          <Button type="submit" className="mt-4">Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

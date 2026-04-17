import React, { useState } from 'react';
import { Category, Habit } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus } from 'lucide-react';

interface HabitFormProps {
  categories: Category[];
  addHabit: (name: string, frequency: 'daily' | 'weekly' | 'monthly', description?: string, categoryId?: string, reminderTime?: string, frequencyTarget?: number) => void;
  addCategory?: (name: string, color: string) => Promise<string | undefined> | undefined;
}

export function HabitForm({ categories, addHabit, addCategory }: HabitFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [frequencyTarget, setFrequencyTarget] = useState<number | ''>('');
  const [reminderTime, setReminderTime] = useState('');
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const target = typeof frequencyTarget === 'number' ? frequencyTarget : undefined;
      addHabit(name.trim(), frequency, description.trim(), categoryId === 'none' ? undefined : categoryId, reminderTime || undefined, target);
      setName('');
      setDescription('');
      setCategoryId('none');
      setFrequency('daily');
      setFrequencyTarget('');
      setReminderTime('');
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Habit
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="habit-name">Habit Name</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Read 10 pages"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="habit-desc">Description (Optional)</Label>
            <Input
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Non-fiction books"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="frequency">Frequency</Label>
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
              <Label htmlFor="frequency-target">Target Frequency (Days/{frequency === 'weekly' ? 'Week' : 'Month'})</Label>
              <Input
                id="frequency-target"
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
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={(val) => {
              if (val === 'new') {
                setIsCreatingCategory(true);
                setCategoryId('none');
              } else {
                setIsCreatingCategory(false);
                setCategoryId(val || 'none');
              }
            }}>
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
                {addCategory && (
                  <SelectItem value="new" className="text-primary font-medium border-t mt-1 pt-1">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Category...
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {isCreatingCategory && (
              <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/50 border rounded-md">
                <Label className="text-xs font-semibold">New Category Details</Label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 flex flex-col gap-2">
                    <Input 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)} 
                      placeholder="Category name"
                      autoFocus
                    />
                  </div>
                  <Button type="button" size="sm" onClick={async () => {
                    if (newCategoryName.trim() && addCategory) {
                      const newId = await addCategory(newCategoryName.trim(), newCategoryColor);
                      if (newId) {
                        setCategoryId(newId);
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }
                    }
                  }}>Add</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder-time">Reminder Time (Optional)</Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
          <Button type="submit" className="mt-4">Save Habit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

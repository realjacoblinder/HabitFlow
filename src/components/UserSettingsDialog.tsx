import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Settings } from 'lucide-react';

interface UserSettingsDialogProps {
  user: User;
  updateUser: (id: string, updates: Partial<User>) => void;
}

export function UserSettingsDialog({ user, updateUser }: UserSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [ntfyTopic, setNtfyTopic] = useState(user.ntfyTopic || '');

  useEffect(() => {
    if (isOpen) {
      setNtfyTopic(user.ntfyTopic || '');
    }
  }, [isOpen, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(user.id, { ntfyTopic: ntfyTopic.trim() || undefined });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="icon" title="User Settings" />}>
        <Settings className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ntfy-topic">NTFY Topic (for reminders)</Label>
            <Input
              id="ntfy-topic"
              value={ntfyTopic}
              onChange={(e) => setNtfyTopic(e.target.value)}
              placeholder="e.g., my_secret_habit_topic"
            />
            <p className="text-xs text-muted-foreground">
              We will send HTTP POST requests to https://ntfy.sh/&lt;topic&gt; for your habit reminders.
            </p>
          </div>
          <Button type="submit" className="mt-4">Save Settings</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

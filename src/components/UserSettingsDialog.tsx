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
  const [isTesting, setIsTesting] = useState(false);

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

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send test notification');
      }
      alert('Test notification sent successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTesting(false);
    }
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
          <div className="flex gap-2 mt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={handleTestNotification} disabled={isTesting || !user.ntfyTopic}>
              {isTesting ? 'Sending...' : 'Test Notification'}
            </Button>
            <Button type="submit" className="flex-1">Save Settings</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { User } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, User as UserIcon } from 'lucide-react';

interface UserSwitcherProps {
  users: User[];
  currentUserId: string | null;
  onSwitchUser: (id: string) => void;
  onCreateUser: (username: string) => void;
}

export function UserSwitcher({ users, currentUserId, onSwitchUser, onCreateUser }: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      onCreateUser(newUsername.trim());
      setNewUsername('');
      setIsOpen(false);
    }
  };

  const currentUser = users.find(u => u.id === currentUserId);

  return (
    <div className="flex items-center gap-2">
      {users.length > 0 && (
        <Select
          value={currentUserId || ''}
          onValueChange={(val) => {
            if (val === 'new') {
              setIsOpen(true);
            } else {
              onSwitchUser(val);
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2 truncate">
              <UserIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentUser ? currentUser.username : 'Select User'}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
            ))}
            <SelectItem value="new" className="text-primary font-medium">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add New User
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {users.length === 0 && (
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create User
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="e.g. Alex"
                required
              />
            </div>
            <Button type="submit" className="mt-2">Create User</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

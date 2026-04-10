import React, { useState, useEffect } from 'react';
import { useHabits } from './hooks/useHabits';
import { CategoryManager } from './components/CategoryManager';
import { HabitForm } from './components/HabitForm';
import { HabitList } from './components/HabitList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Activity } from 'lucide-react';
import { UserSwitcher } from './components/UserSwitcher';
import { UserSettingsDialog } from './components/UserSettingsDialog';
import { User } from './types';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch users: ${res.status} ${text}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON but got ${contentType}: ${text}`);
        }
        return res.json();
      })
      .then(data => {
        setUsers(data);
        const savedUserId = localStorage.getItem('habitflow_user_id');
        if (savedUserId && data.find((u: User) => u.id === savedUserId)) {
          setCurrentUserId(savedUserId);
        } else if (data.length > 0) {
          setCurrentUserId(data[0].id);
          localStorage.setItem('habitflow_user_id', data[0].id);
        }
        setIsUsersLoaded(true);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setIsUsersLoaded(true);
      });
  }, []);

  const handleCreateUser = async (username: string) => {
    const id = uuidv4();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, username })
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const { user } = await res.json();
        setUsers([...users, user]);
        setCurrentUserId(user.id);
        localStorage.setItem('habitflow_user_id', user.id);
      } else {
        alert('Unexpected response from server.');
      }
    } else {
      alert('Failed to create user. Username might already exist.');
    }
  };

  const handleSwitchUser = (id: string) => {
    setCurrentUserId(id);
    localStorage.setItem('habitflow_user_id', id);
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
    }
  };

  const {
    habits,
    categories,
    records,
    addHabit,
    updateHabit,
    deleteHabit,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleHabitRecord,
    isLoaded
  } = useHabits(currentUserId);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);

  if (!isUsersLoaded || (currentUserId && !isLoaded)) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!currentUserId && isUsersLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6 bg-card rounded-xl shadow-lg border">
          <h1 className="text-2xl font-bold mb-6 text-center">Welcome to HabitFlow</h1>
          <p className="text-muted-foreground mb-6 text-center">Please create a user to get started.</p>
          <div className="flex justify-center">
            <UserSwitcher
              users={users}
              currentUserId={currentUserId}
              onSwitchUser={handleSwitchUser}
              onCreateUser={handleCreateUser}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">HabitFlow</h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <UserSwitcher
              users={users}
              currentUserId={currentUserId}
              onSwitchUser={handleSwitchUser}
              onCreateUser={handleCreateUser}
            />
            {currentUserId && (
              <UserSettingsDialog
                user={users.find(u => u.id === currentUserId)!}
                updateUser={handleUpdateUser}
              />
            )}
            <CategoryManager
              categories={categories}
              addCategory={addCategory}
              updateCategory={updateCategory}
              deleteCategory={deleteCategory}
            />
            <HabitForm categories={categories} addHabit={addHabit} addCategory={addCategory} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Habits</h2>
            <p className="text-muted-foreground mt-1">Track your daily progress and build consistency.</p>
          </div>
          
          <div className="flex w-full sm:w-auto gap-2">
            <Select
              value={selectedFrequency || 'all'}
              onValueChange={(val) => setSelectedFrequency(val === 'all' ? null : val)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Frequencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCategoryId || 'all'}
              onValueChange={(val) => setSelectedCategoryId(val === 'all' ? null : val)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || 'All Categories' : 'All Categories'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <HabitList
          habits={habits}
          categories={categories}
          records={records}
          toggleHabitRecord={toggleHabitRecord}
          updateHabit={updateHabit}
          deleteHabit={deleteHabit}
          selectedCategoryId={selectedCategoryId}
          selectedFrequency={selectedFrequency}
        />
      </main>
    </div>
  );
}

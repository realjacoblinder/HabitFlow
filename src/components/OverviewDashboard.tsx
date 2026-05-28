import React from 'react';
import { Habit, Category, HabitRecord } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { calculateHabitStats, getHeatmapData, getCompletedDates } from '../lib/stats';
import { Flame, CheckCircle2, TrendingUp, Calendar, Trophy, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface OverviewDashboardProps {
  habits: Habit[];
  categories: Category[];
  records: HabitRecord[];
  onBackToList: () => void;
}

export function OverviewDashboard({ habits, categories, records, onBackToList }: OverviewDashboardProps) {
  // Graceful empty state
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No habits tracked yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Create some habits first and record your completions to see your beautiful progress analytics here!
        </p>
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 shadow transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Go to Habit Tracker
        </button>
      </div>
    );
  }

  // Calculate habit-specific statistics
  const habitStats = habits.map((habit) => ({
    habit,
    category: categories.find((c) => c.id === habit.categoryId),
    stats: calculateHabitStats(records, habit),
  }));

  // Summary Metrics
  const totalCompletions = records.filter((r) => r.completed).length;
  
  const bestStreak = Math.max(...habitStats.map((hs) => hs.stats.streak), 0);
  
  const averageCompletionRate = Math.round(
    habitStats.reduce((acc, curr) => acc + curr.stats.completionRate, 0) / habits.length
  );

  // Heatmap calculations (last 139 days ~ 20 weeks)
  const heatmapData = getHeatmapData(records, 139);
  
  // Group days into columns of 7 (weeks)
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Consistency Dashboard</h2>
          <p className="text-muted-foreground mt-1">An honest, high-level analysis of your daily success.</p>
        </div>
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors border px-3 py-1.5 rounded-lg bg-card shadow-sm hover:shadow"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tracker
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Consistency Score */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-24 w-24 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consistency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{averageCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average progress across all active habits
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Best Streak */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Flame className="h-24 w-24 text-orange-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Longest Active Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight flex items-baseline gap-1">
              {bestStreak}
              <span className="text-sm font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Highest current consecutive streak
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Completions */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Trophy className="h-24 w-24 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Completions</CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{totalCompletions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total habit completions logged all-time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Section */}
      <Card>
        <CardHeader>
          <CardTitle>Completions Heatmap</CardTitle>
          <CardDescription>
            Your combined activity across all habits over the last 20 weeks.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="flex gap-1 overflow-x-auto pb-4 pt-2 select-none min-w-full justify-start sm:justify-center scrollbar-thin">
            {/* Days of Week (Y-Axis Labels) */}
            <div className="flex flex-col justify-between text-[10px] text-muted-foreground pr-2 pt-6 pb-1 h-[126px] sticky left-0 bg-card z-10 font-medium">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            <div className="flex flex-col gap-1">
              {/* Months Row (X-Axis Labels) */}
              <div className="flex gap-1 h-5 text-[10px] text-muted-foreground relative font-medium">
                {weeks.map((week, wIdx) => {
                  const showMonth =
                    wIdx === 0 ||
                    format(week[0].date, 'M') !==
                      format(weeks[wIdx - 1]?.[0]?.date || week[0].date, 'M');
                  return (
                    <div
                      key={wIdx}
                      className="w-[14px] text-left overflow-visible whitespace-nowrap"
                    >
                      {showMonth ? format(week[0].date, 'MMM') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Grid Grid */}
              <div className="flex gap-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((day) => {
                      const count = day.count;
                      
                      // Theme classes based on completions
                      let colorClass = 'bg-muted/30 dark:bg-muted/15';
                      if (day.isFuture) {
                        colorClass = 'bg-muted/10 dark:bg-muted/5 opacity-20 cursor-default pointer-events-none';
                      } else if (count === 1) {
                        colorClass = 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300';
                      } else if (count === 2) {
                        colorClass = 'bg-emerald-500/45 text-emerald-900 dark:text-emerald-250';
                      } else if (count === 3) {
                        colorClass = 'bg-emerald-500/70 text-white';
                      } else if (count >= 4) {
                        colorClass = 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600/30';
                      }

                      return (
                        <div
                          key={day.dateStr}
                          className={`w-[14px] h-[14px] rounded-[2px] cursor-pointer hover:scale-125 transition-all hover:ring-2 hover:ring-primary/50 relative group/cell ${colorClass}`}
                          title={day.isFuture ? 'Future' : `${format(day.date, 'EEEE, MMM d, yyyy')}: ${count} completion${count === 1 ? '' : 's'}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="w-[10px] h-[10px] rounded-[1.5px] bg-muted/30 dark:bg-muted/15" />
            <div className="w-[10px] h-[10px] rounded-[1.5px] bg-emerald-500/20" />
            <div className="w-[10px] h-[10px] rounded-[1.5px] bg-emerald-500/45" />
            <div className="w-[10px] h-[10px] rounded-[1.5px] bg-emerald-500/70" />
            <div className="w-[10px] h-[10px] rounded-[1.5px] bg-emerald-500" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Habits Progress breakdown list */}
      <Card>
        <CardHeader>
          <CardTitle>Habits Breakdown</CardTitle>
          <CardDescription>
            Detailed analysis of each individual habit's consistency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habitStats.map(({ habit, category, stats }) => {
              // Streak text styling
              const isStreakActive = stats.streak > 0;
              const flameColor = isStreakActive ? 'text-orange-500 fill-orange-500/10 animate-bounce-subtle' : 'text-muted-foreground/30';

              return (
                <div
                  key={habit.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/10 hover:shadow-sm transition-all duration-200 gap-4"
                >
                  <div className="space-y-1.5 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{habit.name}</span>
                      {category && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: category.color,
                            color: category.color,
                            backgroundColor: `${category.color}08`,
                          }}
                        >
                          {category.name}
                        </Badge>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
                        {habit.description}
                      </p>
                    )}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {habit.frequency}
                    </span>
                  </div>

                  {/* Streak & Completion Rate */}
                  <div className="flex items-center gap-6 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Streak badge */}
                    <div className="flex items-center gap-1.5">
                      <Flame className={`h-5 w-5 ${flameColor}`} />
                      <div className="text-left">
                        <div className="text-sm font-bold leading-none">
                          {stats.streak} day{stats.streak === 1 ? '' : 's'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Current Streak</div>
                      </div>
                    </div>

                    {/* Completion rate progress bar */}
                    <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                      <div className="flex items-baseline justify-between w-full text-xs font-semibold">
                        <span className="text-muted-foreground text-[10px]">
                          {stats.rateText}
                        </span>
                        <span className="text-primary font-bold">
                          {stats.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${stats.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

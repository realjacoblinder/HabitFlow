# HabitFlow — Testing Guide

Step-by-step instructions for manually testing all HabitFlow functionality, from local development through Docker production deployment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Development Mode](#2-development-mode)
3. [Docker Deployment](#3-docker-deployment)
4. [User Management](#4-user-management)
5. [Habit CRUD](#5-habit-crud)
6. [Daily Habit Tracking](#6-daily-habit-tracking)
7. [Weekly & Monthly Habits](#7-weekly--monthly-habits)
8. [Categories](#8-categories)
9. [Filtering & Sorting](#9-filtering--sorting)
10. [Drag-and-Drop Reordering](#10-drag-and-drop-reordering)
11. [Streaks](#11-streaks)
12. [Calendar Dialog](#12-calendar-dialog)
13. [Edit Habit Dialog](#13-edit-habit-dialog)
14. [Notifications (ntfy)](#14-notifications-ntfy)
15. [API Endpoints (curl)](#15-api-endpoints-curl)
16. [Data Persistence](#16-data-persistence)
17. [Edge Cases & Error Handling](#17-edge-cases--error-handling)
18. [Accessibility Checks](#18-accessibility-checks)

---

## 1. Prerequisites

Before testing, ensure the following are installed:

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Node.js | 24+ | `node --version` / `nvm_current` |
| npm | 10+ | `npm --version` / `npm_run -v` |
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |
| curl | any | `curl --version` |

> [!TIP]
> **Integrated NVM Tools:** This project includes dedicated NVM management tools. You should use `nvm_use`, `npm_run`, and `npx_run` when fetching, installing, or testing new packages to ensure environment consistency.

Clone the repository and install dependencies:

```bash
git clone <repo-url> && cd HabitFlow
npm install
```

---

## 2. Development Mode

### 2.1 Start the Dev Server

```bash
npm run dev
```

**Expected result:**
- Terminal shows `Server running on http://localhost:3000`
- Pino-formatted JSON logs appear on each request
- No TypeScript compilation errors

### 2.2 Open the App

1. Open `http://localhost:3000` in a browser.
2. **Expected:** The "Welcome to HabitFlow" screen appears with a prompt to create a user.
3. No console errors in browser DevTools (F12 → Console tab).

### 2.3 Verify Hot Module Replacement (HMR)

1. With the dev server running, open `src/App.tsx`.
2. Change the heading text `HabitFlow` to `HabitFlow TEST`.
3. **Expected:** The change appears in the browser instantly without a full page reload.
4. Revert the change.

### 2.4 Verify the Build

```bash
npm run build
```

**Expected result:**
- The command completes without errors.
- A `dist/` directory is created containing `index.html` and `assets/` with `.js` and `.css` bundles.
- No warnings about missing dependencies.

### 2.5 TypeScript Lint Check

```bash
npm run lint
```

**Expected result:** `tsc --noEmit` completes with no type errors.

---

## 3. Docker Deployment

### 3.1 Build the Docker Image

```bash
docker build -t habitflow .
```

**Expected result:**
- All build steps complete successfully (npm install, npm run build).
- Image is tagged as `habitflow:latest`.
- Final image uses `node:24-bookworm-slim` as the base.

### 3.2 Run the Container (Standalone)

```bash
mkdir -p habitflow_data
docker run -d \
  --name habitflow-test \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_PATH=/app/data/habits.db \
  -v "$(pwd)/habitflow_data:/app/data" \
  habitflow
```

**Expected result:**
- Container starts without crashing.
- `docker logs habitflow-test` shows `Server running on http://localhost:3000`.
- No `ERR_MODULE_NOT_FOUND` or `SyntaxError` in the logs.

### 3.3 Verify the Container Is Healthy

```bash
# Wait ~35 seconds for the first healthcheck, then:
docker inspect --format='{{.State.Health.Status}}' habitflow-test
```

**Expected result:** `healthy`

### 3.4 Test the Healthcheck Endpoint

```bash
curl -s http://localhost:3000/api/health | jq .
```

**Expected result:**
```json
{
  "status": "ok"
}
```

### 3.5 Verify the Frontend Is Served

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

**Expected result:** `200`

```bash
curl -s http://localhost:3000/ | head -5
```

**Expected result:** HTML content starting with `<!doctype html>`.

### 3.6 Run via Docker Compose

```bash
docker rm -f habitflow-test 2>/dev/null  # Clean up standalone container
docker compose up -d
```

**Expected result:**
- Container `habitflow` starts.
- `docker compose logs habitflow` shows the server running.
- `http://localhost:3000` loads the app in a browser.

### 3.7 Clean Up Docker Resources

```bash
docker compose down
# Or for the standalone container:
docker rm -f habitflow-test
```

---

## 4. User Management

### 4.1 Create the First User

1. Open `http://localhost:3000`.
2. **Expected:** "Welcome to HabitFlow" screen with user creation prompt.
3. Click the user switcher/create button.
4. Enter a username (e.g., `TestUser`) and submit.
5. **Expected:** The app transitions to the main dashboard with the header showing `TestUser`.

### 4.2 Create a Second User

1. Click the user switcher in the header.
2. Create another user (e.g., `SecondUser`).
3. **Expected:** The app switches to the new user's empty dashboard.

### 4.3 Switch Between Users

1. Click the user switcher dropdown.
2. Select the first user (`TestUser`).
3. **Expected:** The dashboard reloads showing `TestUser`'s habits (any previously created).
4. **Expected:** `localStorage` key `habitflow_user_id` updates to the selected user's ID (check in DevTools → Application → Local Storage).

### 4.4 Verify User Persistence Across Refresh

1. Note which user is currently selected.
2. Refresh the page (F5).
3. **Expected:** The same user is auto-selected (from `localStorage`).

### 4.5 Duplicate Username Prevention

1. Try to create a user with an already-existing username.
2. **Expected:** An alert or error message appears saying the username already exists.

---

## 5. Habit CRUD

### 5.1 Create a Daily Habit

1. Click the "New Habit" / "+" button in the header.
2. Fill in:
   - **Name:** `Morning Run`
   - **Frequency:** Daily
   - **Description:** `Run for 30 minutes`
   - **Category:** (leave empty or select one)
3. Submit the form.
4. **Expected:** The habit card appears in the list with:
   - The name `Morning Run`
   - Description text visible
   - A 7-day checkbox row (Mon–Sun) on the right side
   - A streak counter showing `0 Days`

### 5.2 Create a Weekly Habit

1. Create a new habit:
   - **Name:** `Meal Prep`
   - **Frequency:** Weekly
   - **Target:** `3` (3 times per week)
2. **Expected:** The habit card shows a circular progress ring instead of daily checkboxes.

### 5.3 Create a Monthly Habit

1. Create a new habit:
   - **Name:** `Budget Review`
   - **Frequency:** Monthly
   - **Target:** `1`
2. **Expected:** The habit card shows a progress ring and a "X hits this month" badge.

### 5.4 Delete a Habit

1. Click the trash icon on any habit card.
2. **Expected:** The habit is immediately removed from the list.
3. **Verify:** Refresh the page — the habit should NOT reappear (confirms server-side deletion).
4. **Note (known issue — BUG 3):** There is no confirmation dialog. A mis-click permanently deletes the habit.

---

## 6. Daily Habit Tracking

### 6.1 Toggle Today's Completion

1. On a daily habit card, find today's column (highlighted with bold text).
2. Click the empty circle (○) for today.
3. **Expected:** The circle fills in (●) and the streak counter increments.
4. Click the filled circle again.
5. **Expected:** The circle empties and the streak counter adjusts.

### 6.2 Toggle Past Days

1. Click circles for previous days in the 7-day row.
2. **Expected:** Each day toggles independently.
3. **Verify persistence:** Refresh the page — completed days should remain checked.

### 6.3 Verify Record Persistence

1. Complete today's habit.
2. Open DevTools → Network tab.
3. **Expected:** A `POST /api/records` request was sent with `{"habitId": "...", "date": "YYYY-MM-DD", "completed": true}`.
4. Refresh the page.
5. **Expected:** The completion status is preserved.

---

## 7. Weekly & Monthly Habits

### 7.1 Weekly Habit — Progress Ring

1. On a weekly habit with target = 3:
2. Click the "Log Today" button (or the progress ring area).
3. **Expected:** The ring fills proportionally (1/3 complete).
4. The text inside the ring updates (e.g., `1/3`).

### 7.2 Weekly Habit — Complete the Target

1. Log completions on 3 different days within the current week.
2. **Expected:** The ring fills completely and the streak increments to `1 Week`.

### 7.3 Monthly Habit — Badge Counter

1. On a monthly habit, log a completion for today.
2. **Expected:** The "X hits this month" badge updates.

---

## 8. Categories

### 8.1 Create a Category

1. Click the "Categories" button in the header.
2. Enter a new category name (e.g., `Health`) and pick a color.
3. Submit.
4. **Expected:** The category appears in the category list with its color dot.

### 8.2 Assign a Habit to a Category

1. Create a new habit and select the `Health` category.
2. **Expected:** The habit card displays a colored dot or badge matching the category color.

### 8.3 Edit a Category

1. In the Categories dialog, click the edit icon on a category.
2. Change the name or color and save.
3. **Expected:** All habits assigned to that category reflect the updated name/color immediately.

### 8.4 Delete a Category

1. Click the trash icon on a category.
2. **Expected:** The category is removed.
3. **Expected:** Habits that were in that category now show as uncategorized (no category badge).
4. **Note (known issue — BUG 4):** There is no confirmation dialog.

---

## 9. Filtering & Sorting

### 9.1 Filter by Frequency

1. Create habits with all three frequencies (daily, weekly, monthly).
2. Use the "All Frequencies" dropdown and select `Daily`.
3. **Expected:** Only daily habits are visible.
4. Select `Weekly`.
5. **Expected:** Only weekly habits are visible.
6. Select `All Frequencies`.
7. **Expected:** All habits reappear.

### 9.2 Filter by Category

1. Assign habits to different categories.
2. Use the "All Categories" dropdown and select a specific category.
3. **Expected:** Only habits in that category are shown.
4. Select `All Categories` to clear the filter.

### 9.3 Sort by Category

1. Use the sort dropdown and select `Category`.
2. **Expected:** Habits are grouped by category name (alphabetical).
3. Uncategorized habits appear at the top (empty string sorts first).

### 9.4 Sort by Frequency

1. Select `Frequency` sort mode.
2. **Expected:** Habits are ordered: Daily → Weekly → Monthly.

### 9.5 Sort Manual (Default)

1. Select `Manual` sort mode.
2. **Expected:** Habits appear in their custom `position` order.
3. Drag handles and chevron buttons become visible (see Section 10).

---

## 10. Drag-and-Drop Reordering

### 10.1 Prerequisites

- Sort mode must be set to `Manual`.
- No category or frequency filter can be active.
- If filters are active, drag handles and chevrons should be hidden.

### 10.2 Reorder via Drag Handle

1. Set sort mode to `Manual` with no filters.
2. Grab the drag handle (⋮⋮ icon on the left) of a habit card.
3. Drag it above or below another habit.
4. Release.
5. **Expected:** The habit snaps into its new position.
6. **Verify persistence:** Refresh the page — the new order should be preserved.

### 10.3 Reorder via Chevron Buttons

1. Click the up chevron (▲) on a habit that is NOT the first item.
2. **Expected:** The habit moves up one position.
3. Click the down chevron (▼) on a habit that is NOT the last item.
4. **Expected:** The habit moves down one position.

### 10.4 Boundary Tests

1. Click the up chevron on the **first** habit.
2. **Expected:** Nothing happens (no error, no movement).
3. Click the down chevron on the **last** habit.
4. **Expected:** Nothing happens.

---

## 11. Streaks

### 11.1 Daily Streak — Building

1. Create a daily habit.
2. Check off today and yesterday.
3. **Expected:** Streak shows `2 Days`.
4. Also check off the day before yesterday.
5. **Expected:** Streak shows `3 Days`.

### 11.2 Daily Streak — Grace Period

1. Leave today unchecked, but check off yesterday and the day before.
2. **Expected:** The streak shows `2 Days` (the algorithm gives a one-day grace period — it checks yesterday if today isn't completed).

### 11.3 Daily Streak — Breaking

1. Leave both today and yesterday unchecked.
2. Even if the day before yesterday is checked, the streak should show `0 Days`.

### 11.4 Weekly Streak

1. Create a weekly habit with target = 2.
2. Meet the target for the current week (log 2+ completions).
3. **Expected:** Streak shows `1 Week`.
4. If the previous week was also met, streak shows `2 Weeks`.

### 11.5 Longest Streak Badge

1. Build up a streak over multiple days/weeks.
2. Then break it and build a shorter streak.
3. **Expected:** The "Best: X" badge below the current streak shows the historical maximum.

---

## 12. Calendar Dialog

### 12.1 Open the Calendar

1. Click the calendar icon on a habit card.
2. **Expected:** A dialog opens showing a month grid.

### 12.2 Daily Habit Calendar

1. On a daily habit, open the calendar.
2. **Expected:** Days with completion records show a check mark and colored background.
3. Click an unmarked day.
4. **Expected:** The day toggles to complete (colored background appears).
5. Click it again.
6. **Expected:** The day toggles back to incomplete.

### 12.3 Monthly Habit Calendar (Heatmap)

1. On a monthly habit, open the calendar.
2. **Expected:** A heatmap-style grid renders (colored squares for completed days, muted for incomplete).
3. Hover over a cell.
4. **Expected:** A tooltip shows the full date (`MMM d, yyyy`).
5. **Note (known issue — BUG 20):** Day numbers are hidden in heatmap mode.

### 12.4 Navigate Months

1. Use the left/right arrows in the calendar dialog to change months.
2. **Expected:** The grid updates to show the selected month.
3. Past completion records should appear on their respective days.

---

## 13. Edit Habit Dialog

### 13.1 Open the Edit Dialog

1. Click the edit/pencil icon on a habit card.
2. **Expected:** A dialog opens pre-populated with the habit's current values (name, description, frequency, category, reminder time, target).

### 13.2 Change the Habit Name

1. Edit the name field and save.
2. **Expected:** The habit card updates immediately with the new name.
3. Refresh — name is persisted.

### 13.3 Change the Frequency

1. Change a daily habit to weekly (and set a frequency target).
2. Save.
3. **Expected:** The habit card's right panel switches from the 7-day checkbox view to the progress ring view.

### 13.4 Set a Reminder Time

1. Set the reminder time field to a valid `HH:MM` value.
2. Save.
3. **Expected:** A bell icon appears on the habit card.

### 13.5 Change the Category

1. Change the habit's category to a different one.
2. Save.
3. **Expected:** The category color badge updates immediately.

---

## 14. Notifications (ntfy)

### 14.1 Configure an ntfy Topic

1. Click the settings gear icon in the header.
2. Enter an ntfy topic name (e.g., `habitflow-test-12345`).
3. Save.
4. **Expected:** The settings dialog closes without error.

### 14.2 Test Notification

1. Open the settings dialog.
2. Click "Test Notification".
3. **Expected:** A success alert appears saying the notification was sent.
4. Check `https://ntfy.sh/habitflow-test-12345` in a browser.
5. **Expected:** A test notification message from HabitFlow appears.
6. **Note (known issue — BUG 15):** The test uses the saved topic, not what's currently in the input field.

### 14.3 Reminder Delivery (Manual Verification)

1. Set a habit's reminder time to 1-2 minutes from now.
2. Ensure the ntfy topic is configured.
3. Subscribe to the ntfy topic: `curl -s "https://ntfy.sh/habitflow-test-12345/json?poll=1"`
4. Wait for the reminder time to pass.
5. **Expected:** A notification appears with the message `Time to complete your habit: <name>`.
6. **Note (known issue — BUG 8):** Reminders fire even for already-completed habits.

---

## 15. API Endpoints (curl)

These tests verify the backend independently from the UI. Run them against a running instance.

### 15.1 Health Check

```bash
curl -s http://localhost:3000/api/health | jq .
# Expected: {"status":"ok"}
```

### 15.2 List Users

```bash
curl -s http://localhost:3000/api/users | jq .
# Expected: Array of user objects
```

### 15.3 Create a User

```bash
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"id":"test-id-123","username":"CurlUser"}' | jq .
# Expected: {"success":true,"user":{"id":"test-id-123","username":"CurlUser","ntfyTopic":null}}
```

### 15.4 Fetch User Data

```bash
curl -s http://localhost:3000/api/data \
  -H "x-user-id: test-id-123" | jq .
# Expected: {"categories":[],"habits":[],"records":[]}
```

### 15.5 Create a Category

```bash
curl -s -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-id-123" \
  -d '{"id":"cat-1","name":"Fitness","color":"#22c55e"}' | jq .
# Expected: {"success":true}
```

### 15.6 Create a Habit

```bash
curl -s -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-id-123" \
  -d '{"id":"habit-1","name":"Push-ups","frequency":"daily","categoryId":"cat-1","createdAt":1713052800000}' | jq .
# Expected: {"success":true}
```

### 15.7 Toggle a Record

```bash
# Complete a habit for today
curl -s -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-id-123" \
  -d '{"habitId":"habit-1","date":"2026-04-13","completed":true}' | jq .
# Expected: {"success":true}

# Uncomplete it
curl -s -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-id-123" \
  -d '{"habitId":"habit-1","date":"2026-04-13","completed":false}' | jq .
# Expected: {"success":true}
```

### 15.8 Update a Habit

```bash
curl -s -X PUT http://localhost:3000/api/habits/habit-1 \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-id-123" \
  -d '{"name":"Diamond Push-ups","frequency":"daily"}' | jq .
# Expected: {"success":true}
```

### 15.9 Reorder Habits

```bash
curl -s -X PUT http://localhost:3000/api/reorder-habits \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-id-123" \
  -d '{"orders":[{"id":"habit-1","position":1}]}' | jq .
# Expected: {"success":true}
```

### 15.10 Delete a Habit

```bash
curl -s -X DELETE http://localhost:3000/api/habits/habit-1 \
  -H "x-user-id: test-id-123" | jq .
# Expected: {"success":true}
```

### 15.11 Delete a Category

```bash
curl -s -X DELETE http://localhost:3000/api/categories/cat-1 \
  -H "x-user-id: test-id-123" | jq .
# Expected: {"success":true}
```

### 15.12 Verify User Isolation

```bash
# Create data as user A
curl -s -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-a" \
  -d '{"id":"hab-a","name":"User A Habit","frequency":"daily","createdAt":1713052800000}' | jq .

# Fetch as user B — should NOT see user A's habit
curl -s http://localhost:3000/api/data \
  -H "x-user-id: user-b" | jq '.habits'
# Expected: [] (empty array)
```

### 15.13 Rate Limiting

```bash
# Fire many rapid requests to trigger the rate limiter (150 requests per 15 min window)
for i in $(seq 1 155); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  echo "Request $i: $CODE"
done
# Expected: Requests 1-150 return 200, requests 151+ return 429
```

---

## 16. Data Persistence

### 16.1 Dev Mode — SQLite File

1. Start the dev server (`npm run dev`), create a user and some habits.
2. Stop the server (Ctrl+C).
3. **Expected:** A `habits.db` file exists in the project root.
4. Restart the server.
5. **Expected:** All previously created users, habits, records, and categories are preserved.

### 16.2 Docker — Volume Mount

1. Start the Docker container with the volume mount (`-v $(pwd)/habitflow_data:/app/data`).
2. Create data via the UI.
3. Stop and remove the container: `docker rm -f habitflow`.
4. Start a new container with the same volume mount.
5. **Expected:** All data is preserved — the new container reads from the same `habits.db`.

### 16.3 Verify the Database File

```bash
# Dev mode
file habits.db
# Expected: "SQLite 3.x database"

# Docker mode
file habitflow_data/habits.db
# Expected: "SQLite 3.x database"
```

### 16.4 Inspect Database Contents

```bash
# Install sqlite3 if needed, then:
sqlite3 habits.db "SELECT * FROM users;"
sqlite3 habits.db "SELECT id, name, frequency, position FROM habits ORDER BY position;"
sqlite3 habits.db "SELECT * FROM records WHERE completed = 1 LIMIT 10;"
sqlite3 habits.db "SELECT * FROM categories;"
```

### 16.5 Automated Backup

The server runs a daily SQLite backup (every 24 hours) to `backup.db` in the same directory as the database.

1. To verify the backup mechanism exists without waiting 24 hours, check the server logs for `Automated database backup completed successfully` after the interval elapses.
2. Alternatively, set a shorter interval temporarily in `server.ts` for testing.

---

## 17. Edge Cases & Error Handling

### 17.1 Empty State

1. Create a new user with no habits.
2. **Expected:** The main area shows "No habits found. Create one to get started!"

### 17.2 Long Habit Names

1. Create a habit with a very long name (200+ characters).
2. **Expected:** The card renders without layout breakage. Text should truncate or wrap gracefully.

### 17.3 Special Characters in Names

1. Create a habit with special characters: `Morning "Routine" & <Stretch> 'Session'`
2. **Expected:** The name renders correctly without XSS or HTML injection.

### 17.4 Concurrent Browser Tabs

1. Open the app in two tabs with the same user.
2. In Tab 1, create a new habit.
3. **Expected (Tab 2):** The new habit does NOT appear automatically (no real-time sync). Refreshing Tab 2 should show it.

### 17.5 Network Failure Handling

1. Open DevTools → Network tab → set to "Offline".
2. Try to toggle a habit completion.
3. **Expected:** The UI optimistically updates (circle fills in), but the API call fails silently.
4. Reconnect and refresh.
5. **Expected:** The completion is NOT saved (it reverts to the server's state).
6. **Note (known issue — BUG 5):** There is no error toast or rollback animation.

### 17.6 Server Down

1. Stop the backend server.
2. Try to interact with the app.
3. **Expected:** API calls fail. The UI may show stale data. No crashes or blank screens.

### 17.7 Mobile Responsive Layout

1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M).
2. Set viewport to a mobile size (375×667).
3. **Expected:**
   - The header stacks vertically.
   - Filter/sort dropdowns are usable.
   - Habit cards display legibly.
   - The 7-day checkbox row may shrink but should remain tappable.

---

## 18. Accessibility Checks

### 18.1 Keyboard Navigation

1. Press `Tab` to navigate through the UI.
2. **Expected:** Focus indicators are visible on buttons, inputs, and interactive elements.
3. Press `Enter` or `Space` to activate buttons.

### 18.2 Screen Reader Labels

1. Inspect buttons with DevTools.
2. **Expected:** Buttons have accessible labels (via `aria-label`, visible text, or associated `<label>` elements).
3. **Note (known issue — BUG 12):** The frequency target label in EditHabitDialog has a broken `htmlFor`.

### 18.3 Color Contrast

1. Inspect text elements for sufficient contrast against their backgrounds.
2. Habits with colored category badges should still have readable text.

---

## Quick Reference: Full Test Sequence

For a full regression test, run through this checklist in order:

1. [ ] `npm run lint` — no errors
2. [ ] `npm run build` — no errors, `dist/` created
3. [ ] `npm run dev` — server starts, app loads at :3000
4. [ ] Docker build — `docker build -t habitflow .` succeeds
5. [ ] Docker run — container starts, healthcheck passes
6. [ ] Create first user — welcome screen → dashboard transition
7. [ ] Create second user — user switching works, data is isolated
8. [ ] Create habits (daily, weekly, monthly) — all three types render correctly
9. [ ] Toggle daily completions — circles toggle, streaks update
10. [ ] Weekly/monthly progress — ring fills, badge counts update
11. [ ] Create and assign categories — color dots appear on habit cards
12. [ ] Filter by frequency and category — correct subset shown
13. [ ] Sort modes (manual, category, frequency) — order changes correctly
14. [ ] Drag-and-drop reorder — position persists after refresh
15. [ ] Calendar dialog — view and toggle past dates
16. [ ] Edit habit — changes persist after refresh
17. [ ] Delete habit — removed from list and database
18. [ ] ntfy notification test — message received on ntfy topic
19. [ ] Data persistence — stop server/container, restart, data intact
20. [ ] Page refresh — all state preserved via API re-fetch

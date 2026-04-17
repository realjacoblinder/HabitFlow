# HabitFlow - Project Concepts

## Overview
Full-stack habit tracker. React frontend, Express/SQLite backend. Support user profiles, categories (daily, weekly, monthly), completion records, reminders via [ntfy.sh](https://ntfy.sh).

## Architecture

### Frontend
- **Framework:** React 19 (Vite 6)
- **Styling:** Tailwind CSS v4, `shadcn/ui`, Lucide icons, `@base-ui/react`.
- **State Management:** Custom hooks (`useHabits`), local state.
- **Routing:** SPA. Primary views in `App.tsx`.
- **User Authentication:** Simulated. Managed via local storage (`habitflow_user_id`). ID sent in `x-user-id` header.

### Backend
- **Server:** Node.js, Express.
- **APIs:** Standard CRUD + `/api/reorder-habits` for batch position updates.
- **Development Mode:** Vite as Express middleware (`server: { middlewareMode: true }`).
- **Database:** SQLite3 via `better-sqlite3`. Auto-create `users`, `categories`, `habits`, `records` tables on startup.
- **Jobs:** `setInterval` runs every 10s. Check `habit.reminderTime` vs current time (`HH:MM`). Send HTTP POST to user's `ntfy.sh` topic.

## Data Models
1. **Users:** `{ id, username, ntfyTopic }`
   - `ntfyTopic` is user channel for notifications.
2. **Categories:** `{ id, name, color }`
   - Group habits.
3. **Habits:** `{ id, name, description, categoryId, frequency, createdAt, reminderTime, frequencyTarget, position }`
   - `frequency`: daily, weekly, monthly.
   - `reminderTime`: `"HH:MM"` string.
   - `frequencyTarget`: integer target count.
   - `position`: integer for manual sort order.
4. **Records:** `{ habitId, date, completed }`
   - Track completion on date (`YYYY-MM-DD`).

## Notification System (NTFY)
- Users set `ntfy.sh` topic in settings.
- Server push payload (`Title`, `Tags`, body) to `https://ntfy.sh/<topic>`.
- **Note:** External networks (e.g. `ntfy.sh`) must be accessible.

## NVM Management Tools
This project leverages integrated NVM tools to ensure environment consistency across development and testing. These tools should be used when fetching, installing, or testing new packages:
- **Environment Control:** Use `nvm_use` to switch between versions and `nvm_install` for new environments.
- **Dependency Management:** Use `npm_run` for all `npm install` and script execution tasks.
- **Binary Execution:** Use `npx_run` for executing package binaries without local installation.
- **Status Checks:** Use `nvm_current` and `nvm_list` to verify context.

## Nuance and Best Practices for Future Code Generation
- **Client-Server Integration in Dev:** Shared server instance (`localhost:3000`). `/api/` routes hit Express, others to Vite.
- **Security/Auth:** `x-user-id` header insecure. Convenience profile switcher. Real auth needs major changes.
- **SQLite Concurrency:** `better-sqlite3` use synchronous, blocking calls. Fine for personal app. Watch large payloads/queries in Express event loop.
- **Artifacts and `.gitignore`:** `CONCEPTS.md` in `.gitignore`. **Add future artifacts, scratchpads, temp files to `.gitignore`.**

## Troubleshooting

### Orphaned Local Server / Port 3000 in Use
If Docker fails to start because port 3000 is occupied, but no Docker containers are running (`docker ps`), a local Node.js process (e.g. from a timed-out `npm run dev` task) has likely detached into the background and is holding the port.

**To find and kill the process:**
1. **Find the process ID (PID):**
   ```bash
   lsof -i:3000
   ```
2. **Kill the process forcefully:**
   ```bash
   kill -9 <PID_FROM_PREVIOUS_COMMAND>
   ```
   *(Alternatively, run as a one-liner: `lsof -t -i:3000 | xargs kill -9`)*

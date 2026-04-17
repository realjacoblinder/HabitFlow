# HabitFlow Codebase Production Preparation

This document outlines the direct codebase modifications required to fully prepare HabitFlow for a robust production deployment. 

---

## Step 1: SQLite Reliability & Backups (`server.ts`)
**Goal:** Ensure the database handles concurrency effectively and can be safely backed up without shutting down the server.
- **Task 1.1:** Enable WAL (Write-Ahead Logging) mode in `better-sqlite3` to improve concurrency and prevent locking issues.
  - **Action:** Add `db.pragma('journal_mode = WAL');` directly after database initialization.
- **Task 1.2:** Implement an automated internal backup system.
  - **Action:** Add a `setInterval` or cron-like task within Node to periodically execute SQLite's online backup API (e.g., `await db.backup('/app/data/backup.db')`).

## Step 2: Health Checks & Observability (`server.ts` & `Dockerfile`)
**Goal:** Provide endpoints for orchestration tools to verify server health, and implement structured logging.
- **Task 2.1:** Create a `GET /api/health` checking endpoint.
  - **Action:** Add an Express route that performs a lightweight `SELECT 1` query to verify both the database and the HTTP event loop are responsive.
- **Task 2.2:** Add health checking directly to the container build.
  - **Action:** Add a `HEALTHCHECK` directive in the `Dockerfile` that pings the new health endpoint.
- **Task 2.3:** Implement structured logging.
  - **Action:** Replace simplistic `console.log` calls with a dedicated logging library (like `pino` or `winston`) across the full Express API.

## Step 3: Security Hardening (`server.ts`)
**Goal:** Secure the application against common vulnerabilities via hardened HTTP headers and rate controls.
- **Task 3.1:** Automatically apply security headers.
  - **Action:** Install the `helmet` NPM package and inject it as top-level middleware (`app.use(helmet())`) to guard against XSS and sniffing mechanisms.
- **Task 3.2:** Mitigate abuse patterns.
  - **Action:** Implement an `express-rate-limit` middleware on critical `/api` endpoints (especially user-switching and creation) to deter brute-forcing.

## Step 4: Container Process Management (`Dockerfile`)
**Goal:** Ensure Node.js processes terminate gracefully when the container stops, avoiding the dreaded Docker/Node zombie interaction.
- **Task 4.1:** Wrap the execution in an init layer.
  - **Action:** Modify the `Dockerfile` to `apt-get install -y dumb-init` and use it as the `ENTRYPOINT`.
  - **Important Note:** To maintain your `1000:1000` user permissions, ensure this `apt-get install` command (and any other installations like `curl` for healthchecks) is placed *before* the `USER 1000:1000` directive in your Dockerfile. Package installation requires root privileges during the build phase, but `dumb-init` will run flawlessly as user 1000 in production.

---
*Note: Any future artifacts similar to this DEPLOYMENT.md file should be appended to the .gitignore!*

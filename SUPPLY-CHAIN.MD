# HabitFlow — Supply-Chain Audit

> **Updated:** 2026-04-16  
> **Node:** v24 · **npm audit** + **npm outdated** + manual review  
> **Total dependencies (installed):** 599 (487 prod, 12 dev, 101 optional)

---

## ✅ Security Vulnerabilities (Resolved)

All known vulnerabilities have been resolved. The ghost dependency `@google/genai` was removed, and the remaining transitive vulnerabilities were patched via `npm audit fix`.

| # | Package | Status | Severity | CVE / Advisory | Action Taken |
|---|---------|--------|----------|----------------|--------------|
| 1 | **protobufjs** | Fixed | **CRITICAL** | [GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg) | Removed via `@google/genai` uninstall |
| 2 | **hono** | Fixed | Moderate | [GHSA-458j-xx4x-4375](https://github.com/advisories/GHSA-458j-xx4x-4375) | Patched to ≥ 4.12.14 via `npm audit fix` |

---

## ✨ Ghost Dependency Removed

`@google/genai` was listed in `dependencies` but never used. It has been uninstalled, removing both CVEs and significantly reducing the dependency tree (removed ~330 transitive packages).

---

## 📦 Core Package Status (Post-Upgrade)

All core framework and build tools have been upgraded to their latest major versions.

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| **express** | 5.2.1 | **Latest** | Upgraded from v4. Path matching updated to v5 syntax. |
| **express-rate-limit** | 8.3.2 | **Latest** | Upgraded from v7. |
| **vite** | 8.0.8 | **Latest** | Upgraded from v6. Now using **Rolldown** bundler. |
| **lucide-react** | 1.8.0 | **Latest** | Upgraded from 0.x. UI verified for icon compatibility. |
| **typescript** | 6.0.3 | **Latest** | Upgraded from v5. Explicit types for React 19 added. |
| **pino** | 10.3.1 | **Latest** | Upgraded from v9. |
| **pino-http** | 11.0.0 | **Latest** | Upgraded from v10. |

---

## 🧹 Cleanup Results

| Package | Action | Status |
|---------|--------|--------|
| **autoprefixer** | Uninstalled | Redundant with Tailwind CSS v4. |
| **@types/uuid** | Uninstalled | Redundant with `uuid@13` built-in types. |
| **vite** (duplicate) | Deduplicated | Moved to `devDependencies` only. |

---

## ✅ Final Action Plan Status

| Priority | Action | Status | Effort | Result |
|----------|--------|--------|--------|--------|
| ✅ Fixed | `npm uninstall @google/genai` | **Done** | 1 min | Eliminated 2 CVEs |
| ✅ Done | `npm uninstall -D autoprefixer` | **Done** | 1 min | Cleaner dependency tree |
| ✅ Done | `npm uninstall @types/uuid` | **Done** | 1 min | Cleaner dependency tree |
| ✅ Done | Move `vite` to `devDependencies` | **Done** | 1 min | Correct classification |
| ✅ Done | Upgrade `lucide-react` 0.x → 1.x | **Done** | 30 min | Modern icon library |
| ✅ Done | Upgrade `express` 4 → 5 | **Done** | 1 hr | Active maintenance branch |
| ✅ Done | Upgrade `vite` 6 → 8 | **Done** | 1 hr | Rolldown performance benefits |
| ✅ Done | Upgrade `pino` 9 → 10, `pino-http` 10 → 11 | **Done** | 30 min | Latest logging engine |
| ✅ Done | Upgrade `typescript` 5 → 6 | **Done** | 30 min | Stricter type safety |

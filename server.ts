import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const logger = pino();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || 'habits.db';
const db = new Database(dbPath);

// Initialize DB
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    color TEXT
  );
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    description TEXT,
    categoryId TEXT,
    frequency TEXT,
    createdAt INTEGER,
    position INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS records (
    habitId TEXT,
    userId TEXT,
    date TEXT,
    completed INTEGER,
    PRIMARY KEY (habitId, userId, date)
  );
`);

try { db.exec("ALTER TABLE users ADD COLUMN ntfyTopic TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE habits ADD COLUMN reminderTime TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE habits ADD COLUMN frequencyTarget INTEGER"); } catch (e) {}
try { db.exec("ALTER TABLE habits ADD COLUMN position INTEGER DEFAULT 0"); } catch (e) {}

// Daily automated SQLite backup
setInterval(async () => {
  try {
    const backupPath = path.join(path.dirname(dbPath), 'backup.db');
    await db.backup(backupPath);
    logger.info(`Automated database backup completed successfully to ${backupPath}`);
  } catch (err) {
    logger.error({ err }, 'Failed to run automated database backup');
  }
}, 24 * 60 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use Helmet for security headers, but don't block Vite features during Dev
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // Bind structured logging
  app.use(pinoHttp({ logger }));

  app.use(express.json());

  // Apply rate limiting specifically on backend API routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 150,
    message: { error: 'Too many requests; please try again later.' }
  });
  app.use('/api/', apiLimiter);

  // Healthcheck endpoint for orchestrators (e.g., Docker HEALTHCHECK)
  app.get('/api/health', (req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.status(200).json({ status: 'ok' });
    } catch (err) {
      logger.error({ err }, 'Healthcheck database ping failed');
      res.status(500).json({ status: 'error', message: 'Database unreachable' });
    }
  });

  // Middleware to extract userId
  app.use((req, res, next) => {
    res.locals.userId = req.headers['x-user-id'] || 'default-user';
    next();
  });

  // Users
  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { id, username, ntfyTopic } = req.body;
    try {
      db.prepare('INSERT INTO users (id, username, ntfyTopic) VALUES (?, ?, ?)').run(id, username, ntfyTopic || null);
      res.json({ success: true, user: { id, username, ntfyTopic } });
    } catch (e) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  app.put('/api/users/:id', (req, res) => {
    const { ntfyTopic } = req.body;
    db.prepare('UPDATE users SET ntfyTopic = ? WHERE id = ?').run(ntfyTopic || null, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/test-notification', (req, res) => {
    const userId = res.locals.userId;
    const user = db.prepare('SELECT ntfyTopic FROM users WHERE id = ?').get(userId) as { ntfyTopic: string | null } | undefined;

    if (!user || !user.ntfyTopic) {
      return res.status(400).json({ error: 'No NTFY topic configured for this user.' });
    }

    fetch(`https://ntfy.sh/${user.ntfyTopic}`, {
      method: 'POST',
      body: 'This is a test notification from HabitFlow!',
      headers: {
        'Title': 'Test Notification',
        'Tags': 'tada,bell'
      }
    }).then(ntfyRes => {
      if (!ntfyRes.ok) throw new Error('NTFY responded with ' + ntfyRes.status);
      res.json({ success: true });
    }).catch(err => {
      logger.error({ err }, 'Test notification failed');
      res.status(500).json({ error: 'Failed to send notification.' });
    });
  });

  // API Routes
  app.get('/api/data', (req, res) => {
    const userId = res.locals.userId;
    const categories = db.prepare('SELECT * FROM categories WHERE userId = ?').all(userId);
    const habits = db.prepare('SELECT * FROM habits WHERE userId = ? ORDER BY position ASC, createdAt ASC').all(userId);
    const records = db.prepare('SELECT * FROM records WHERE userId = ?').all(userId).map((r: any) => ({
      ...r,
      completed: r.completed === 1
    }));
    res.json({ categories, habits, records });
  });

  // Categories
  app.post('/api/categories', (req, res) => {
    const { id, name, color } = req.body;
    db.prepare('INSERT INTO categories (id, userId, name, color) VALUES (?, ?, ?, ?)').run(id, res.locals.userId, name, color);
    res.json({ success: true });
  });
  app.put('/api/categories/:id', (req, res) => {
    const { name, color } = req.body;
    db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ? AND userId = ?').run(name, color, req.params.id, res.locals.userId);
    res.json({ success: true });
  });
  app.delete('/api/categories/:id', (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ? AND userId = ?').run(req.params.id, res.locals.userId);
    db.prepare('UPDATE habits SET categoryId = NULL WHERE categoryId = ? AND userId = ?').run(req.params.id, res.locals.userId);
    res.json({ success: true });
  });

  // Habits
  app.post('/api/habits', (req, res) => {
    const { id, name, description, categoryId, frequency, createdAt, reminderTime, frequencyTarget } = req.body;
    const maxPos = db.prepare('SELECT MAX(position) as maxPos FROM habits WHERE userId = ?').get(res.locals.userId) as { maxPos: number | null };
    const position = (maxPos?.maxPos || 0) + 1;
    
    db.prepare('INSERT INTO habits (id, userId, name, description, categoryId, frequency, createdAt, reminderTime, frequencyTarget, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, res.locals.userId, name, description || null, categoryId || null, frequency || 'daily', createdAt, reminderTime || null, frequencyTarget || null, position
    );
    res.json({ success: true });
  });
  app.put('/api/habits/:id', (req, res) => {
    const { name, description, categoryId, frequency, reminderTime, frequencyTarget } = req.body;
    db.prepare('UPDATE habits SET name = ?, description = ?, categoryId = ?, frequency = ?, reminderTime = ?, frequencyTarget = ? WHERE id = ? AND userId = ?').run(
      name, description || null, categoryId || null, frequency || 'daily', reminderTime || null, frequencyTarget || null, req.params.id, res.locals.userId
    );
    res.json({ success: true });
  });
  app.delete('/api/habits/:id', (req, res) => {
    db.prepare('DELETE FROM habits WHERE id = ? AND userId = ?').run(req.params.id, res.locals.userId);
    db.prepare('DELETE FROM records WHERE habitId = ? AND userId = ?').run(req.params.id, res.locals.userId);
    res.json({ success: true });
  });

  app.put('/api/reorder-habits', (req, res) => {
    const { orders } = req.body;
    const update = db.prepare('UPDATE habits SET position = ? WHERE id = ? AND userId = ?');
    const transaction = db.transaction((data) => {
      for (const item of data) {
        update.run(item.position, item.id, res.locals.userId);
      }
    });
    transaction(orders);
    res.json({ success: true });
  });

  // Records
  app.post('/api/records', (req, res) => {
    const { habitId, date, completed } = req.body;
    if (completed) {
      db.prepare('INSERT OR REPLACE INTO records (habitId, userId, date, completed) VALUES (?, ?, ?, 1)').run(habitId, res.locals.userId, date);
    } else {
      db.prepare('DELETE FROM records WHERE habitId = ? AND userId = ? AND date = ?').run(habitId, res.locals.userId, date);
    }
    res.json({ success: true });
  });

  // Background job for reminders
  let lastCheckedMinute = -1;
  setInterval(() => {
    const now = new Date();
    const currentMinute = now.getMinutes();
    if (currentMinute !== lastCheckedMinute) {
      lastCheckedMinute = currentMinute;
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      try {
        const habitsToRemind = db.prepare(`
          SELECT h.name, h.description, u.ntfyTopic 
          FROM habits h 
          JOIN users u ON h.userId = u.id 
          WHERE h.reminderTime = ? AND u.ntfyTopic IS NOT NULL AND u.ntfyTopic != ''
        `).all(currentTime) as { name: string, description: string, ntfyTopic: string }[];

        for (const habit of habitsToRemind) {
          fetch(`https://ntfy.sh/${habit.ntfyTopic}`, {
            method: 'POST',
            body: `Time to complete your habit: ${habit.name}`,
            headers: {
              'Title': 'HabitFlow Reminder',
              'Tags': 'bell'
            }
          }).catch(err => logger.error({ err }, 'Failed to send ntfy reminder'));
        }
      } catch (err) {
        logger.error({ err }, 'Error checking reminders');
      }
    }
  }, 10000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

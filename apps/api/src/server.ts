import cors from 'cors';
import express from 'express';
import { DEFAULT_PAGE_SIZE, listTasks, openDatabase } from './db.js';
import { TASK_CATEGORIES, TASK_STATUSES, type TaskFilters } from './types.js';

const PORT = Number(process.env.PORT ?? 8080);

const db = openDatabase();

const app = express();

app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/** Keeps a query value only if it is one of the allowed enum values. */
const pick = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined =>
  allowed.includes(value as T) ? (value as T) : undefined;

const MAX_PAGE_SIZE = 100;

/** Parses a positive integer query value, clamped to max; anything else gives the fallback. */
const positiveInt = (value: unknown, fallback: number, max = Infinity): number => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : fallback;
};

app.get('/api/tasks', (req, res) => {
  const filters: TaskFilters = {
    status: pick(req.query.status, TASK_STATUSES),
    category: pick(req.query.category, TASK_CATEGORIES),
    q: typeof req.query.q === 'string' ? req.query.q.trim() || undefined : undefined,
  };
  const page = {
    page: positiveInt(req.query.page, 1),
    pageSize: positiveInt(req.query.size, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  };
  try {
    res.json(listTasks(db, filters, page));
  } catch {
    // Fail soft so the table always renders.
    res.json({ items: [], total: 0, page: 1, pageSize: page.pageSize });
  }
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});

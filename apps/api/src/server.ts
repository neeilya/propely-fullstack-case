import cors from 'cors';
import express from 'express';
import { listTasks, openDatabase } from './db.js';
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

app.get('/api/tasks', (req, res) => {
  const filters: TaskFilters = {
    status: pick(req.query.status, TASK_STATUSES),
    category: pick(req.query.category, TASK_CATEGORIES),
  };
  try {
    res.json(listTasks(db, filters));
  } catch {
    // Fail soft so the table always renders.
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});

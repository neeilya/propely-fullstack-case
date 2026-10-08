import cors from 'cors';
import express from 'express';
import { DEFAULT_PAGE_SIZE, listTasks, openDatabase } from './db.js';
import { tasksPdf } from './pdf.js';
import { TASK_CATEGORIES, TASK_STATUSES, type PageRequest, type TaskFilters } from './types.js';

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

/** Filters and page selection from the query string; both task routes accept the same params. */
function parseTaskQuery(query: Record<string, unknown>): {
  filters: TaskFilters;
  page: PageRequest;
} {
  return {
    filters: {
      status: pick(query.status, TASK_STATUSES),
      category: pick(query.category, TASK_CATEGORIES),
      q: typeof query.q === 'string' ? query.q.trim() || undefined : undefined,
    },
    page: {
      page: positiveInt(query.page, 1),
      pageSize: positiveInt(query.size, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    },
  };
}

app.get('/api/tasks', (req, res) => {
  const { filters, page } = parseTaskQuery(req.query);
  try {
    res.json(listTasks(db, filters, page));
  } catch {
    // Fail soft so the table always renders.
    res.json({ items: [], total: 0, page: 1, pageSize: page.pageSize });
  }
});

/** Same params as /api/tasks. Without `size` every matching row is exported, not just one page. */
app.get('/api/tasks.pdf', (req, res) => {
  const { filters, page } = parseTaskQuery(req.query);
  const scope = req.query.size === undefined ? { pageSize: Number.MAX_SAFE_INTEGER } : page;
  const result = listTasks(db, filters, scope);
  res.attachment(`oppgaver-${new Date().toISOString().slice(0, 10)}.pdf`);
  tasksPdf(result, filters).pipe(res);
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});

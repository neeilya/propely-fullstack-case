import cors from 'cors';
import express from 'express';
import { listTasks, openDatabase } from './db.js';

const PORT = Number(process.env.PORT ?? 8080);

const db = openDatabase();

const app = express();

app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tasks', (_req, res) => {
  try {
    res.json(listTasks(db));
  } catch {
    // Fail soft so the table always renders.
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`API listening at http://localhost:${PORT}`);
});

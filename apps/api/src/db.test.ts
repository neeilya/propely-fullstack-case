import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.DB_PATH = ':memory:';
const { listTasks, openDatabase } = await import('./db.js');

test('listTasks resolves property_name from the properties table', () => {
  const db = openDatabase();
  const tasks = listTasks(db);

  assert.equal(tasks.length, 1000);
  for (const task of tasks) {
    const property = db
      .prepare<[string], { name: string }>('SELECT name FROM properties WHERE id = ?')
      .get(task.property_id);
    assert.equal(task.property_name, property?.name);
  }
});

test('listTasks applies status and category filters together', () => {
  const db = openDatabase();
  const all = listTasks(db);
  const filtered = listTasks(db, { status: 'New', category: 'Plumbing' });

  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((task) => task.status === 'New' && task.category === 'Plumbing'));
  assert.equal(
    filtered.length,
    all.filter((task) => task.status === 'New' && task.category === 'Plumbing').length,
  );
  assert.equal(listTasks(db, { status: undefined }).length, all.length);
});

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

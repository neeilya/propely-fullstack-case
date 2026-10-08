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

test('listTasks search is a case-insensitive substring match across title, description and property', () => {
  const db = openDatabase();
  const all = listTasks(db);
  const ids = (tasks: { id: string }[]) => tasks.map((task) => task.id).sort();
  const matches = (task: (typeof all)[number], q: string) =>
    [task.title, task.description, task.property_name, task.property_id].some((text) =>
      text.toLowerCase().includes(q.toLowerCase()),
    );

  // Mixed case and Norwegian letters (SQLite's own lower() only folds ASCII).
  for (const q of ['LYSKILDER', 'blåbærstien', 'SJØGATA', 'prop-004']) {
    const found = listTasks(db, { q });
    assert.ok(found.length > 0, q);
    assert.deepEqual(ids(found), ids(all.filter((task) => matches(task, q))));
  }
  assert.deepEqual(
    ids(listTasks(db, { q: 'lyskilder', status: 'Completed' })),
    ids(all.filter((task) => task.status === 'Completed' && matches(task, 'lyskilder'))),
  );
  assert.equal(listTasks(db, { q: '' }).length, all.length);
});

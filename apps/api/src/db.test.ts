import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.DB_PATH = ':memory:';
const { listTasks, openDatabase } = await import('./db.js');

/** Every matching task, in server order, regardless of pagination. */
const listAll = (db: ReturnType<typeof openDatabase>, filters = {}) =>
  listTasks(db, filters, { pageSize: 10_000 }).items;

test('listTasks resolves property_name from the properties table', () => {
  const db = openDatabase();
  const tasks = listAll(db);

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
  const all = listAll(db);
  const filtered = listAll(db, { status: 'New', category: 'Plumbing' });

  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((task) => task.status === 'New' && task.category === 'Plumbing'));
  assert.equal(
    filtered.length,
    all.filter((task) => task.status === 'New' && task.category === 'Plumbing').length,
  );
  assert.equal(listAll(db, { status: undefined }).length, all.length);
});

test('listTasks search is a case-insensitive substring match across title, description and property', () => {
  const db = openDatabase();
  const all = listAll(db);
  const ids = (tasks: { id: string }[]) => tasks.map((task) => task.id).sort();
  const matches = (task: (typeof all)[number], q: string) =>
    [task.title, task.description, task.property_name, task.property_id].some((text) =>
      text.toLowerCase().includes(q.toLowerCase()),
    );

  // Mixed case and Norwegian letters (SQLite's own lower() only folds ASCII).
  for (const q of ['LYSKILDER', 'blåbærstien', 'SJØGATA', 'prop-004']) {
    const found = listAll(db, { q });
    assert.ok(found.length > 0, q);
    assert.deepEqual(ids(found), ids(all.filter((task) => matches(task, q))));
  }
  assert.deepEqual(
    ids(listAll(db, { q: 'lyskilder', status: 'Completed' })),
    ids(all.filter((task) => task.status === 'Completed' && matches(task, 'lyskilder'))),
  );
  assert.equal(listAll(db, { q: '' }).length, all.length);
});

test('listTasks pages are newest first, partition the filtered set, and clamp out-of-range pages', () => {
  const db = openDatabase();
  const filters = { status: 'Completed' as const };
  const all = listAll(db, filters);
  for (let i = 1; i < all.length; i++) {
    assert.ok(all[i - 1].created_at >= all[i].created_at);
  }

  const pageSize = 30;
  const lastPage = Math.ceil(all.length / pageSize);
  const seen: string[] = [];
  for (let page = 1; page <= lastPage; page++) {
    const result = listTasks(db, filters, { page, pageSize });
    assert.deepEqual(
      { total: result.total, page: result.page, pageSize: result.pageSize },
      { total: all.length, page, pageSize },
    );
    assert.ok(result.items.length <= pageSize);
    seen.push(...result.items.map((task) => task.id));
  }
  assert.deepEqual(
    seen,
    all.map((task) => task.id),
  );

  assert.equal(listTasks(db, filters, { page: 999, pageSize }).page, lastPage);
  assert.equal(listTasks(db, filters, { page: 0, pageSize }).page, 1);
  const empty = listTasks(db, { q: 'no such task anywhere' });
  assert.deepEqual(empty, { items: [], total: 0, page: 1, pageSize: 25 });
});

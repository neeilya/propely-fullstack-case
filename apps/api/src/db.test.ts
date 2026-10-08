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

test('tasksPdf renders every row plus the filter and page summary', async () => {
  const { tasksPdf } = await import('./pdf.js');
  const db = openDatabase();
  const result = listTasks(db, { status: 'New' }, { page: 2, pageSize: 40 });
  const doc = tasksPdf(result, { status: 'New', q: 'lys' }, { compress: false });
  const chunks: Buffer[] = [];
  for await (const chunk of doc) chunks.push(chunk as Buffer);
  const pdf = Buffer.concat(chunks);
  // pdfkit writes each text run as a TJ array of hex strings; join them back into lines.
  const text = [...pdf.toString('latin1').matchAll(/\[([^\]]*)\] TJ/g)]
    .map((m) => [...m[1].matchAll(/<([0-9a-f]+)>/g)].map((h) => h[1]).join(''))
    .map((hex) => Buffer.from(hex, 'hex').toString('latin1'))
    .join('\n');

  assert.ok(pdf.subarray(0, 5).equals(Buffer.from('%PDF-')));
  assert.equal(result.items.length, 40);
  for (const task of result.items) assert.ok(text.includes(task.id), task.id);
  assert.ok(text.includes('Status: New \xb7 S\xf8k: \xab'), 'filter summary');
  assert.ok(text.includes('av 200 oppgaver (side 2 av 5)'), 'range summary');
  assert.ok(text.includes('Side 1 av '), 'page footer');
  // Row numbers continue from the page offset.
  assert.ok(text.includes('\n41\n'), 'row numbers');
});

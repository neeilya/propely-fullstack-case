/**
 * PDF export of a task listing: a title, the active filters, and the same ten columns as the
 * web table. Built-in Helvetica covers æøå, so no font is embedded.
 */

import PDFDocument from 'pdfkit';
import type { TaskFilters, TaskPage, TaskWithProperty } from './types.js';

const COLUMNS: {
  label: string;
  width: number | '*';
  align?: 'right';
  value: (task: TaskWithProperty, index: number) => string;
}[] = [
  { label: '#', width: 28, align: 'right', value: (_, index) => String(index + 1) },
  { label: 'ID', width: 56, value: (task) => task.id },
  { label: 'Tittel', width: 130, value: (task) => task.title },
  { label: 'Beskrivelse', width: '*', value: (task) => task.description },
  { label: 'Kategori', width: 56, value: (task) => task.category },
  { label: 'Status', width: 56, value: (task) => task.status },
  { label: 'Eiendom', width: 110, value: (task) => task.property_name },
  { label: 'Opprettet', width: 54, value: (task) => task.created_at },
  { label: 'Frist', width: 54, value: (task) => task.due_date ?? '—' },
  {
    label: 'Kostnad (NOK)',
    width: 50,
    align: 'right',
    value: (task) => String(task.cost_nok || '—'),
  },
];

const FILTER_LABELS: Record<keyof TaskFilters, string> = {
  status: 'Status',
  category: 'Kategori',
  q: 'Søk',
};

/** One line describing the active filters, or "Ingen filtre". */
function describeFilters(filters: TaskFilters): string {
  const parts = (Object.keys(FILTER_LABELS) as (keyof TaskFilters)[])
    .filter((key) => filters[key])
    .map((key) => `${FILTER_LABELS[key]}: ${key === 'q' ? `«${filters[key]}»` : filters[key]}`);
  return parts.length ? parts.join(' · ') : 'Ingen filtre';
}

/** "Viser alle N oppgaver" for a full export, otherwise the row range and page of the total. */
function describeRange({ items, total, page, pageSize }: TaskPage): string {
  if (items.length === total) return `Viser alle ${total} oppgaver`;
  const first = (page - 1) * pageSize + 1;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return `Viser ${first}–${first + items.length - 1} av ${total} oppgaver (side ${page} av ${lastPage})`;
}

/**
 * Renders the given page of tasks as a landscape A4 PDF. The returned document is already ended,
 * so callers just pipe it. Row numbers continue from the page offset, like the web table.
 */
export function tasksPdf(
  result: TaskPage,
  filters: TaskFilters,
  options: PDFKit.PDFDocumentOptions = {},
): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 36,
    bufferPages: true,
    info: { Title: 'Vedlikeholdsoppgaver' },
    ...options,
  });
  const offset = (result.page - 1) * result.pageSize;

  doc.fontSize(16).text('Vedlikeholdsoppgaver');
  doc
    .fontSize(9)
    .fillColor('#555')
    .text(`Eksportert ${new Date().toISOString().slice(0, 10)} · ${describeFilters(filters)}`)
    .text(describeRange(result))
    .moveDown(1)
    .fillColor('black')
    .fontSize(8);

  doc.table({
    defaultStyle: { border: [0, 0, 0.5, 0], borderColor: '#bbb', padding: 3 },
    columnStyles: COLUMNS.map(({ width, align }) => ({ width, align: { x: align ?? 'left' } })),
    rowStyles: (row) => (row === 0 ? { backgroundColor: '#eee', border: [0, 0, 1, 0] } : undefined),
    data: [
      COLUMNS.map(({ label }) => ({ text: label, type: 'TH' as const })),
      ...result.items.map((task, index) => COLUMNS.map(({ value }) => value(task, offset + index))),
    ],
  });

  // Page numbers go into the bottom margin, so lift the margin while writing to avoid a new page.
  const { count } = doc.bufferedPageRange();
  for (let i = 0; i < count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fontSize(8)
      .fillColor('#555')
      .text(`Side ${i + 1} av ${count}`, doc.page.margins.left, doc.page.height - bottom + 10, {
        align: 'center',
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
    doc.page.margins.bottom = bottom;
  }

  doc.end();
  return doc;
}

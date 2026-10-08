import { tasksPdfUrl } from './api';
import type { TaskFilters } from './filters';
import type { TaskPage } from './types';

const ITEM = 'block whitespace-nowrap px-3 py-2 hover:bg-slate-100 focus:bg-slate-100';

const close = (details: HTMLDetailsElement) => details.removeAttribute('open');

/**
 * "Last ned PDF" button opening a menu with two choices: the page on screen, or every row the
 * active filters and search match. A native <details> does the toggling; it closes when focus
 * leaves it, on Escape, and after a choice.
 */
export function DownloadPdf({ filters, tasks }: { filters: TaskFilters; tasks: TaskPage }) {
  return (
    <details
      className="relative text-sm"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close(event.currentTarget);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close(event.currentTarget);
      }}
      onClick={(event) => {
        if (event.target instanceof HTMLAnchorElement) close(event.currentTarget);
      }}
    >
      <summary className="cursor-pointer list-none rounded border border-slate-300 bg-white px-3 py-2 [&::-webkit-details-marker]:hidden">
        Last ned PDF ▾
      </summary>
      <div
        role="menu"
        className="absolute left-0 z-10 mt-1 rounded border border-slate-200 bg-white shadow"
        // Keep focus inside while clicking a link, so the blur above does not close it mid-click.
        onMouseDown={(event) => event.preventDefault()}
      >
        <a role="menuitem" className={ITEM} href={tasksPdfUrl(filters, 'page')}>
          Denne siden ({tasks.items.length} rader)
        </a>
        <a role="menuitem" className={ITEM} href={tasksPdfUrl(filters, 'all')}>
          Alle treff ({tasks.total} rader)
        </a>
      </div>
    </details>
  );
}

import { useEffect, useRef, useState } from 'react';

import { tasksPdfUrl } from './api';
import type { TaskFilters } from './filters';
import type { TaskPage } from './types';

const ITEM = 'block whitespace-nowrap px-3 py-2 hover:bg-slate-100 focus:bg-slate-100';

/**
 * "Last ned PDF" button opening a menu with two choices: the page on screen, or every row the
 * active filters and search match. A native <details> does the toggling; it closes on a click
 * outside, when focus leaves it, on Escape, and after a choice.
 */
export function DownloadPdf({ filters, tasks }: { filters: TaskFilters; tasks: TaskPage }) {
  const [open, setOpen] = useState(false);
  const details = useRef<HTMLDetailsElement>(null);

  // Safari does not focus <summary> on click, so blur alone would not close the menu there.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!details.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <details
      ref={details}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
      onClick={(event) => {
        if (event.target instanceof HTMLAnchorElement) setOpen(false);
      }}
      className="relative text-sm"
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

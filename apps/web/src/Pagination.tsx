import { PAGE_SIZES, setFilter } from './filters';
import type { TaskPage } from './types';

const BUTTON = 'rounded border border-slate-300 bg-white px-2 py-1 disabled:opacity-40';

/** First/previous/next/last buttons around the current page, plus a page size select. */
export function Pagination({ total, page, pageSize }: Omit<TaskPage, 'items'>) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const goTo = (target: number) => () => setFilter('page', target);

  return (
    <nav aria-label="Sider" className="flex flex-wrap items-center gap-2 text-sm">
      <button type="button" className={BUTTON} disabled={page <= 1} onClick={goTo(1)}>
        « Første
      </button>
      <button type="button" className={BUTTON} disabled={page <= 1} onClick={goTo(page - 1)}>
        ‹ Forrige
      </button>
      <span className="px-2">
        Side {page} av {lastPage}
      </span>
      <button type="button" className={BUTTON} disabled={page >= lastPage} onClick={goTo(page + 1)}>
        Neste ›
      </button>
      <button type="button" className={BUTTON} disabled={page >= lastPage} onClick={goTo(lastPage)}>
        Siste »
      </button>
      <label className="ml-2 flex items-center gap-2">
        Per side
        <select
          value={pageSize}
          onChange={(event) => setFilter('size', event.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}

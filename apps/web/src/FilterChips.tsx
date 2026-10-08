import { FILTER_OPTIONS, setFilter, type FilterKey, type TaskFilters } from './filters';

const LABELS: Record<FilterKey, string> = { status: 'Status', category: 'Kategori' };

/** One removable chip per active column filter, plus "clear all" when more than one is set. */
export function FilterChips({ filters }: { filters: TaskFilters }) {
  const active = (Object.keys(FILTER_OPTIONS) as FilterKey[]).filter((key) => filters[key]);
  if (active.length === 0) return null;

  return (
    <ul aria-label="Aktive filtre" className="flex flex-wrap items-center gap-2 text-sm">
      {active.map((key) => (
        <li
          key={key}
          className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1"
        >
          {LABELS[key]}: {filters[key]}
          <button
            type="button"
            aria-label={`Fjern filter ${LABELS[key]}`}
            onClick={() => setFilter(key, '')}
            className="ml-1 text-slate-500 hover:text-slate-900"
          >
            ×
          </button>
        </li>
      ))}
      {active.length > 1 && (
        <li>
          <button
            type="button"
            onClick={() => active.forEach((key) => setFilter(key, ''))}
            className="text-slate-600 underline hover:text-slate-900"
          >
            Nullstill alle
          </button>
        </li>
      )}
    </ul>
  );
}

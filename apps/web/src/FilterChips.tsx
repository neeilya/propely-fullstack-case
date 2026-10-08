import {
  FILTER_LABELS,
  filterOptions,
  setFilter,
  type FilterKey,
  type TaskFilters,
} from './filters';
import type { Property } from './types';

/** One removable chip per active column filter, plus "clear all" when more than one is set. */
export function FilterChips({
  filters,
  properties,
}: {
  filters: TaskFilters;
  properties: Property[];
}) {
  const active = (Object.keys(FILTER_LABELS) as FilterKey[]).filter((key) => filters[key]);
  if (active.length === 0) return null;
  const valueLabel = (key: FilterKey) =>
    filterOptions(key, properties).find(({ value }) => value === filters[key])?.label ??
    filters[key];

  return (
    <ul aria-label="Aktive filtre" className="flex flex-wrap items-center gap-2 text-sm">
      {active.map((key) => (
        <li
          key={key}
          className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1"
        >
          {FILTER_LABELS[key]}: {valueLabel(key)}
          <button
            type="button"
            aria-label={`Fjern filter ${FILTER_LABELS[key]}`}
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

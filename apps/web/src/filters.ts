import { useSyncExternalStore } from 'react';

import { TASK_CATEGORIES, TASK_STATUSES, type TaskCategory, type TaskStatus } from './types';

export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
}

/** Filterable columns and their allowed values, keyed by query param name. */
export const FILTER_OPTIONS = { status: TASK_STATUSES, category: TASK_CATEGORIES } as const;
export type FilterKey = keyof typeof FILTER_OPTIONS;

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined =>
  allowed.includes(value as T) ? (value as T) : undefined;

/** Parses filters from a query string. Values outside the enums read as "all". */
export function readFilters(search: string): TaskFilters {
  const params = new URLSearchParams(search);
  return {
    status: pick(params.get('status'), TASK_STATUSES),
    category: pick(params.get('category'), TASK_CATEGORIES),
  };
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
};

/** The URL query string is the only source of truth for filters; nothing is mirrored into React state. */
export function useFilters(): TaskFilters {
  return readFilters(useSyncExternalStore(subscribe, () => window.location.search));
}

/** Writes one filter to the URL (empty value removes it) and notifies useFilters subscribers. */
export function setFilter(key: FilterKey, value: string): void {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  history.replaceState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

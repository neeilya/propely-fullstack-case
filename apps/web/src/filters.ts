import { useSyncExternalStore } from 'react';

import { TASK_CATEGORIES, TASK_STATUSES, type TaskCategory, type TaskStatus } from './types';

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

/** Everything that selects what the table shows. All of it lives in the URL query string. */
export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  /** Free-text search, matched server-side against title, description and property. */
  q?: string;
  /** 1-based page number. */
  page: number;
  size: number;
}

/** Filterable columns and their allowed values, keyed by query param name. */
export const FILTER_OPTIONS = { status: TASK_STATUSES, category: TASK_CATEGORIES } as const;
export type FilterKey = keyof typeof FILTER_OPTIONS;

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined =>
  allowed.includes(value as T) ? (value as T) : undefined;

/** Parses filters from a query string. Values outside the enums read as "all"; bad page/size fall back to defaults. */
export function readFilters(search: string): TaskFilters {
  const params = new URLSearchParams(search);
  const page = Number(params.get('page'));
  const size = Number(params.get('size'));
  return {
    status: pick(params.get('status'), TASK_STATUSES),
    category: pick(params.get('category'), TASK_CATEGORIES),
    q: params.get('q') || undefined,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
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

/**
 * Writes one filter to the URL (empty value removes it) and notifies useFilters subscribers.
 * Changing anything but the page restarts at page 1. Page changes push a history entry so Back
 * steps through pages; everything else replaces, so typing a search does not flood history.
 */
export function setFilter(key: keyof TaskFilters, value: string | number): void {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, String(value));
  else url.searchParams.delete(key);
  if (key !== 'page') url.searchParams.delete('page');
  history[key === 'page' ? 'pushState' : 'replaceState'](null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

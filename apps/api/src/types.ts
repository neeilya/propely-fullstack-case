/**
 * Task domain types for the API.
 *
 * The same enum values are mirrored by CHECK constraints in the SQLite schema
 * (apps/api/src/db.ts).
 */

export const TASK_CATEGORIES = [
  'FireSafety',
  'Plumbing',
  'Electrical',
  'Ventilation',
  'Cleaning',
  'Outdoor',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_STATUSES = ['New', 'InProgress', 'Completed', 'Rejected'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Optional filters for listing tasks. An absent key means "all". */
export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  /** Case-insensitive substring matched against title, description, property name and id. */
  q?: string;
}

/** A single task, exactly as stored in SQLite. */
export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  property_id: string;
  /** ISO 8601 date, e.g. "2024-03-11". */
  created_at: string;
  /** ISO 8601 date, or null. */
  due_date: string | null;
  cost_nok: number | null;
}

/** A task row as served by the API: the stored task plus its property's name. */
export interface TaskWithProperty extends Task {
  property_name: string;
}

/** 1-based page selection. Page numbers past the end are clamped to the last page. */
export interface PageRequest {
  page?: number;
  pageSize?: number;
}

/** One page of tasks plus the total count matching the filters. */
export interface TaskPage {
  items: TaskWithProperty[];
  total: number;
  /** The page actually served, after clamping. */
  page: number;
  pageSize: number;
}

/** A property that tasks belong to, as stored in SQLite. */
export interface Property {
  id: string;
  name: string;
}

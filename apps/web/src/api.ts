import type { TaskFilters } from './filters';
import type { TaskPage } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/** Every set filter as a query string, in the shape both task endpoints accept. */
function toParams(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params;
}

export async function fetchTasks(filters: TaskFilters): Promise<TaskPage> {
  const response = await fetch(`${API_BASE_URL}/api/tasks?${toParams(filters)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as TaskPage;
}

/** URL of the PDF export: the current page, or every row matching the filters when scope is 'all'. */
export function tasksPdfUrl(filters: TaskFilters, scope: 'page' | 'all'): string {
  const params = toParams(filters);
  if (scope === 'all') {
    params.delete('page');
    params.delete('size');
  }
  return `${API_BASE_URL}/api/tasks.pdf?${params}`;
}

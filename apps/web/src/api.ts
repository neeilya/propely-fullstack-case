import type { TaskFilters } from './filters';
import type { TaskPage } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function fetchTasks(filters: TaskFilters): Promise<TaskPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const response = await fetch(`${API_BASE_URL}/api/tasks?${params}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as TaskPage;
}

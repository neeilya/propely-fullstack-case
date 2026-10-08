import type { TaskFilters } from './filters';
import type { Task } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);

  const response = await fetch(`${API_BASE_URL}/api/tasks?${params}`);
  return (await response.json()) as Task[];
}

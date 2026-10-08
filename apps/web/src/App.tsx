import { useEffect, useState } from 'react';

import type { TaskPage } from './types';

import { fetchTasks } from './api';
import { setFilter, useFilters } from './filters';
import { Pagination } from './Pagination';
import { TaskTable } from './TaskTable';

export function App() {
  const [tasks, setTasks] = useState<TaskPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filters = useFilters();

  useEffect(() => {
    // Ignore responses that arrive after the filters changed again.
    let stale = false;
    setError(null);
    fetchTasks(filters)
      .then((result) => {
        if (stale) return;
        setTasks(result);
      })
      .catch((err: unknown) => {
        if (stale) return;
        setTasks(null);
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      stale = true;
    };
  }, [filters.status, filters.category, filters.q, filters.page, filters.size]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Vedlikeholdsoppgaver</h1>
        <p className="text-sm text-slate-500">
          {tasks ? `${tasks.total} oppgaver` : 'Laster oppgaver …'}
        </p>
      </header>

      <main className="p-6">
        {error && (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Kunne ikke hente oppgaver: {error}
          </div>
        )}

        {!error && !tasks && <p className="text-sm text-slate-500">Laster …</p>}

        <input
          type="search"
          aria-label="Søk"
          placeholder="Søk i tittel, beskrivelse og eiendom …"
          value={filters.q ?? ''}
          onChange={(event) => setFilter('q', event.target.value)}
          className="mb-4 w-full max-w-md rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        />

        {tasks && (
          <>
            <TaskTable tasks={tasks.items} filters={filters} />
            <div className="mt-4">
              <Pagination {...tasks} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

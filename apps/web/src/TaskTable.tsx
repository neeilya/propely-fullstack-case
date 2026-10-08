import {
  FILTER_LABELS,
  filterOptions,
  setFilter,
  type FilterKey,
  type TaskFilters,
} from './filters';
import type { Property, Task } from './types';

const COLUMNS: { label: string; filter?: FilterKey }[] = [
  { label: '#' },
  { label: 'ID' },
  { label: 'Tittel' },
  { label: 'Beskrivelse' },
  { label: 'Kategori', filter: 'category' },
  { label: 'Status', filter: 'status' },
  { label: 'Eiendom', filter: 'property' },
  { label: 'Opprettet' },
  { label: 'Frist' },
  { label: 'Kostnad (NOK)' },
];

/**
 * Renders the given tasks in a plain table, in the order given. Filterable columns get a select
 * in their header. Rows are numbered from `offset + 1`, so numbering continues across pages.
 */
export function TaskTable({
  tasks,
  filters,
  properties,
  offset = 0,
}: {
  tasks: Task[];
  filters: TaskFilters;
  properties: Property[];
  offset?: number;
}) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {COLUMNS.map(({ label, filter }) => (
              <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">
                {filter ? (
                  // Capped width so a long property name does not stretch the column.
                  <select
                    aria-label={label}
                    value={filters[filter] ?? ''}
                    onChange={(event) => setFilter(filter, event.target.value)}
                    className="max-w-48 bg-transparent font-medium uppercase"
                  >
                    <option value="">{FILTER_LABELS[filter]}: alle</option>
                    {filterOptions(filter, properties).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr key={task.id} className="border-t border-slate-200 align-top">
              <td className="whitespace-nowrap px-3 py-2 text-left text-slate-500">
                {offset + index + 1}
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                {task.id}
              </td>
              <td className="px-3 py-2">{task.title}</td>
              {/* Descriptions may contain line breaks from the old system. */}
              <td
                className="px-3 py-2 text-slate-600"
                dangerouslySetInnerHTML={{ __html: task.description.replace(/\n/g, '<br />') }}
              />
              <td className="whitespace-nowrap px-3 py-2">{task.category}</td>
              <td className="whitespace-nowrap px-3 py-2">{task.status}</td>
              <td className="min-w-48 px-3 py-2">{task.property_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.created_at}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{task.due_date ?? '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">{task.cost_nok || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

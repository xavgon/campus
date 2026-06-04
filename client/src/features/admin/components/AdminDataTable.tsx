import type { ReactNode } from 'react';

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  getRowKey: (row: T) => string;
}

export const AdminDataTable = <T,>({
  columns,
  rows,
  emptyMessage,
  getRowKey,
}: AdminDataTableProps<T>) => {
  if (rows.length === 0) {
    return (
      <div className="rounded-none border border-dashed border-campus-border/80 bg-black/20 px-6 py-12 text-center text-sm text-campus-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-none border border-campus-border/70">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-campus-border/80 bg-black/40">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-campus-muted ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-campus-border/40 transition hover:bg-black/25"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

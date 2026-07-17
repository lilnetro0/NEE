import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { ErrorBanner, PageHeader } from "@/components/ui";

export function AuditPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [action, setAction] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<{ items: Array<Record<string, unknown>> }>("audit", "list", {
      action: action || undefined,
    })
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Audit logs" />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex gap-2">
        <input
          className="input max-w-sm"
          placeholder="Filter action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
        <button type="button" className="btn" onClick={load}>
          Filter
        </button>
      </div>
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={String(row.id)}>
                <td className="text-xs">{new Date(String(row.created_at)).toLocaleString()}</td>
                <td>{String(row.action)}</td>
                <td className="font-mono text-xs">
                  {String(row.entity_type)}
                  {row.entity_id ? `:${String(row.entity_id)}` : ""}
                </td>
                <td className="font-mono text-xs">{String(row.user_id ?? "system")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

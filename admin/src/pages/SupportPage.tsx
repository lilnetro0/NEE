import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, LoadingBlock, PageHeader } from "@/components/ui";

export function SupportPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminApi<{ items: Array<Record<string, unknown>> }>("support", "list")
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Support tickets" />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={String(t.id)}>
                <td>
                  <Link className="font-mono text-xs text-blue-400" to={`/support/${String(t.id)}`}>
                    {String(t.id).slice(0, 8)}…
                  </Link>
                </td>
                <td>{String(t.reason)}</td>
                <td>{String(t.status)}</td>
                <td className="font-mono text-xs">{String(t.assigned_to ?? "—")}</td>
                <td className="text-xs">{new Date(String(t.created_at)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SupportDetailPage() {
  const { id } = useParams();
  const { can, me } = useAuth();
  const [data, setData] = useState<{
    ticket: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
  } | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<NonNullable<typeof data>>("support", "get", { id })
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <PageHeader title={`Ticket ${String(data.ticket.id).slice(0, 8)}…`} />
      <div className="card text-sm space-y-1">
        <div>Status: {String(data.ticket.status)}</div>
        <div>Reason: {String(data.ticket.reason)}</div>
        <div>Description: {String(data.ticket.description)}</div>
        {can("support.write") ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                void adminApi("support", "assign", { id, assignedTo: me?.userId }).then(load)
              }
            >
              Assign to me
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                void adminApi("support", "setStatus", { id, status: "closed" }).then(load)
              }
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
      <div className="card space-y-3">
        <h2 className="font-bold">History</h2>
        {data.messages.map((m) => (
          <div key={String(m.id)} className="rounded-xl border border-slate-800 p-3 text-sm">
            <div className="text-xs text-slate-500">
              {String(m.author_role)} · {new Date(String(m.created_at)).toLocaleString()}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{String(m.body)}</div>
          </div>
        ))}
        {can("support.write") ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void adminApi("support", "reply", { ticketId: id, body }).then(() => {
                setBody("");
                load();
              });
            }}
          >
            <textarea
              className="textarea min-h-28"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Reply…"
              required
            />
            <button className="btn" type="submit">
              Send reply
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

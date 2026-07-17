import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, LoadingBlock, PageHeader } from "@/components/ui";

export function UsersPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<{ items: Array<Record<string, unknown>> }>("users", "list", {
      q: q || undefined,
    })
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Users" />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex gap-2">
        <input
          className="input max-w-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email / name / phone"
        />
        <button type="button" className="btn" onClick={load}>
          Search
        </button>
      </div>
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Admin</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={String(u.id)}>
                <td>{String(u.display_name)}</td>
                <td className="font-mono text-xs">{String(u.email ?? "—")}</td>
                <td>{String(u.account_status)}</td>
                <td>{u.is_admin ? "yes" : "no"}</td>
                <td>
                  <Link className="text-sm text-blue-400" to={`/users/${String(u.id)}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UserDetailPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [data, setData] = useState<{
    profile: Record<string, unknown>;
    sessions: Array<Record<string, unknown>>;
    roles: string[];
    orders: Array<Record<string, unknown>>;
  } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<NonNullable<typeof data>>("users", "get", { id })
      .then((res) => {
        setData(res);
        setRoles(res.roles);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <PageHeader title={String(data.profile.display_name)} />
      <div className="card space-y-2 text-sm">
        <div>Email: {String(data.profile.email ?? "—")}</div>
        <div>Phone: {String(data.profile.phone ?? "—")}</div>
        <div>Status: {String(data.profile.account_status)}</div>
        {can("users.write") ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {(["active", "suspended", "banned"] as const).map((status) => (
              <button
                key={status}
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  void adminApi("users", "setStatus", { id, status }).then(load)
                }
              >
                Set {status}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {(can("roles.write") || can("roles.read")) && (
        <div className="card space-y-2">
          <h2 className="font-bold">Roles</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {["admin", "support", "content_manager", "operations"].map((role) => (
              <label key={role} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  disabled={!can("roles.write")}
                  onChange={(e) =>
                    setRoles((prev) =>
                      e.target.checked ? [...prev, role] : prev.filter((r) => r !== role),
                    )
                  }
                />
                {role}
              </label>
            ))}
          </div>
          {can("roles.write") ? (
            <button
              type="button"
              className="btn"
              onClick={() => void adminApi("users", "setRoles", { id, roles }).then(load)}
            >
              Save roles
            </button>
          ) : null}
        </div>
      )}
      <div className="card">
        <h2 className="mb-2 font-bold">Sessions / devices</h2>
        <ul className="space-y-1 text-sm">
          {data.sessions.map((s) => (
            <li key={String(s.id)}>
              {String(s.device ?? "device")} · last{" "}
              {new Date(String(s.last_active)).toLocaleString()}
              {s.revoked_at ? " · revoked" : ""}
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2 className="mb-2 font-bold">Orders</h2>
        <ul className="space-y-1 text-sm">
          {data.orders.map((o) => (
            <li key={String(o.id)}>
              <Link className="text-blue-400" to={`/orders/${String(o.id)}`}>
                {String(o.id).slice(0, 8)}…
              </Link>{" "}
              · {String(o.payment_status)} / {String(o.fulfillment_status)} · {String(o.total)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

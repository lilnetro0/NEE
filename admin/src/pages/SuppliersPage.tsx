import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, PageHeader } from "@/components/ui";

type Supplier = {
  id?: string;
  code: string;
  name: string;
  adapter_code: string;
  priority: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  credentialsConfigured?: boolean;
};

export function SuppliersPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Supplier[]>([]);
  const [draft, setDraft] = useState<Supplier>({
    code: "",
    name: "",
    adapter_code: "stub",
    priority: 100,
    is_active: false,
    metadata: {},
  });
  const [secretId, setSecretId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<{ items: Supplier[] }>("suppliers", "list")
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        subtitle="Adapters only — credentials via secret id, never plaintext in the UI"
      />
      {error ? <ErrorBanner message={error} /> : null}
      {can("suppliers.write") ? (
        <form
          className="card grid gap-2 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void adminApi("suppliers", "upsert", {
              supplier: draft,
              credentialsSecretId: secretId || undefined,
            }).then(() => {
              setDraft({
                code: "",
                name: "",
                adapter_code: "stub",
                priority: 100,
                is_active: false,
                metadata: {},
              });
              setSecretId("");
              load();
            });
          }}
        >
          <input
            className="input"
            placeholder="code"
            value={draft.code}
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            required
          />
          <select
            className="select"
            value={draft.adapter_code}
            onChange={(e) => setDraft((d) => ({ ...d, adapter_code: e.target.value }))}
          >
            <option value="stub">stub</option>
            <option value="reloadly">reloadly</option>
            <option value="likecard">likecard</option>
            <option value="gamesdrop">gamesdrop</option>
          </select>
          <input
            className="input"
            type="number"
            placeholder="priority"
            value={draft.priority}
            onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) }))}
          />
          <input
            className="input"
            placeholder="credentials_secret_id (Vault/Edge secret name)"
            value={secretId}
            onChange={(e) => setSecretId(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
            />
            Active
          </label>
          <button className="btn md:col-span-3" type="submit">
            Save supplier
          </button>
        </form>
      ) : null}
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Adapter</th>
              <th>Priority</th>
              <th>Active</th>
              <th>Credentials</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id ?? s.code}>
                <td className="font-mono text-xs">{s.code}</td>
                <td>{s.name}</td>
                <td>{s.adapter_code}</td>
                <td>{s.priority}</td>
                <td>{s.is_active ? "yes" : "no"}</td>
                <td>{s.credentialsConfigured ? "configured" : "missing"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

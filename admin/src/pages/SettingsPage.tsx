import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, PageHeader } from "@/components/ui";

type Setting = { key: string; value: unknown; updated_at: string };

export function SettingsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Setting[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<{ items: Setting[] }>("settings", "list")
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <PageHeader title="App settings" subtitle="Feature flags and operational controls" />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.key} className="card grid gap-2 md:grid-cols-[220px_1fr_auto]">
            <div className="font-mono text-sm">{item.key}</div>
            <textarea
              className="textarea font-mono text-xs"
              value={JSON.stringify(item.value, null, 2)}
              disabled={!can("settings.write")}
              onChange={(e) => {
                try {
                  const value = JSON.parse(e.target.value) as unknown;
                  setItems((prev) =>
                    prev.map((row) => (row.key === item.key ? { ...row, value } : row)),
                  );
                } catch {
                  // keep typing invalid JSON until blur/save
                }
              }}
            />
            {can("settings.write") ? (
              <button
                type="button"
                className="btn"
                onClick={() =>
                  void adminApi("settings", "upsert", {
                    key: item.key,
                    value: item.value,
                  }).then(load)
                }
              >
                Save
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

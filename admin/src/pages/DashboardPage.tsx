import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { ErrorBanner, LoadingBlock, PageHeader } from "@/components/ui";

type DashboardStats = {
  totals: {
    users: number;
    activeUsers: number;
    orders: number;
    pendingOrders: number;
    failedOrders: number;
    products: number;
    categories: number;
    openTickets: number;
    revenuePlaceholder: null;
  };
  systemStatus: {
    maintenanceMode: boolean;
    purchasingEnabled: boolean;
    externalPaymentsEnabled: boolean;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
  }>;
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminApi<DashboardStats>("dashboard", "stats")
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingBlock />;

  const cards = [
    ["Users", data.totals.users],
    ["Active users", data.totals.activeUsers],
    ["Orders", data.totals.orders],
    ["Pending orders", data.totals.pendingOrders],
    ["Failed orders", data.totals.failedOrders],
    ["Products", data.totals.products],
    ["Categories", data.totals.categories],
    ["Open tickets", data.totals.openTickets],
    ["Revenue", "—"],
  ] as const;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Operations overview" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-black">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-bold">System status</h2>
          <ul className="space-y-2 text-sm">
            <li>Maintenance: {data.systemStatus.maintenanceMode ? "ON" : "Off"}</li>
            <li>Purchasing: {data.systemStatus.purchasingEnabled ? "Enabled" : "Disabled"}</li>
            <li>
              External payments:{" "}
              {data.systemStatus.externalPaymentsEnabled ? "Enabled" : "Disabled"}
            </li>
          </ul>
          <Link to="/settings" className="mt-4 inline-block text-sm font-semibold text-blue-400">
            Manage settings
          </Link>
        </div>
        <div className="card">
          <h2 className="mb-3 font-bold">Recent activity</h2>
          <div className="max-h-80 space-y-2 overflow-auto text-sm">
            {data.recentActivity.map((row) => (
              <div key={row.id} className="border-b border-slate-800 pb-2">
                <div className="font-semibold">{row.action}</div>
                <div className="text-xs text-slate-500">
                  {row.entity_type}
                  {row.entity_id ? ` · ${row.entity_id}` : ""} ·{" "}
                  {new Date(row.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {!data.recentActivity.length ? (
              <div className="text-slate-500">No audit events yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

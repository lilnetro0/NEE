import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, LoadingBlock, PageHeader } from "@/components/ui";

export function OrderDetailPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [data, setData] = useState<{
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    timeline: Array<Record<string, unknown>>;
    fulfillmentAttempts: Array<Record<string, unknown>>;
    customer: Record<string, unknown> | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<NonNullable<typeof data>>("orders", "get", { id })
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <LoadingBlock />;

  const order = data.order;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Order ${String(order.id).slice(0, 8)}…`}
        actions={
          <Link to="/orders" className="btn btn-secondary">
            Back
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-2 text-sm">
          <div>Payment: {String(order.payment_status)}</div>
          <div>Fulfillment: {String(order.fulfillment_status)}</div>
          <div>Refund: {String(order.refund_status)}</div>
          <div>
            Total: {String(order.total)} {String(order.display_currency)}
          </div>
          <div>
            Customer:{" "}
            {data.customer ? (
              <Link className="text-blue-400" to={`/users/${String(data.customer.id)}`}>
                {String(data.customer.display_name || data.customer.email)}
              </Link>
            ) : (
              "—"
            )}
          </div>
          {can("orders.write") ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  void adminApi("orders", "setFulfillmentStatus", {
                    id,
                    status: "manual_review",
                  }).then(load)
                }
              >
                Mark manual review
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void adminApi("orders", "cancel", { id }).then(load)}
              >
                Cancel (unpaid only)
              </button>
            </div>
          ) : null}
        </div>
        <div className="card">
          <h2 className="mb-2 font-bold">Items</h2>
          <ul className="space-y-2 text-sm">
            {data.items.map((item) => (
              <li key={String(item.id)}>
                {String(item.title_en)} · SKU {String(item.sku)} · qty {String(item.quantity)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card">
        <h2 className="mb-2 font-bold">Timeline</h2>
        <ul className="space-y-2 text-sm">
          {data.timeline.map((ev) => (
            <li key={String(ev.id)}>
              {String(ev.actor)} · {String(ev.note ?? "")} ·{" "}
              {new Date(String(ev.created_at)).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
      <div className="card overflow-auto">
        <h2 className="mb-2 font-bold">Fulfillment attempts</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Request</th>
              <th>Error</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {data.fulfillmentAttempts.map((a) => (
              <tr key={String(a.id)}>
                <td>{String(a.attempt_number ?? 1)}</td>
                <td>{String(a.provider)}</td>
                <td>{String(a.status)}</td>
                <td className="font-mono text-xs">{String(a.request_id ?? "—")}</td>
                <td className="text-xs">{String(a.error_code ?? a.error_message ?? "—")}</td>
                <td className="text-xs">{new Date(String(a.created_at)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

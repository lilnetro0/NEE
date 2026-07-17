import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { ErrorBanner, PageHeader } from "@/components/ui";

type Order = {
  id: string;
  user_id: string;
  payment_status: string;
  fulfillment_status: string;
  refund_status: string;
  total: number;
  display_currency: string;
  created_at: string;
};

export function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<{ items: Order[] }>("orders", "list", {
      q: q || undefined,
      paymentStatus: paymentStatus || undefined,
    })
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        subtitle="Payment confirmation is webhook-only — manual mark-paid is blocked"
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select max-w-xs"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        >
          <option value="">All payment statuses</option>
          <option value="pending_payment">pending_payment</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button type="button" className="btn" onClick={load}>
          Filter
        </button>
      </div>
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Refund</th>
              <th>Total</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link className="font-mono text-xs text-blue-400" to={`/orders/${o.id}`}>
                    {o.id.slice(0, 8)}…
                  </Link>
                </td>
                <td>{o.payment_status}</td>
                <td>{o.fulfillment_status}</td>
                <td>{o.refund_status}</td>
                <td>
                  {o.total} {o.display_currency}
                </td>
                <td className="text-xs text-slate-400">
                  {new Date(o.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, LoadingBlock, PageHeader } from "@/components/ui";

type Product = {
  id: string;
  kind: string;
  title_en: string;
  title_ar: string;
  category_id: string;
  brand_id: string;
  is_visible: boolean;
  is_featured: boolean;
  is_archived: boolean;
  from_price: number;
  display_currency: string;
};

export function ProductsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(null);
    void adminApi<{ items: Product[] }>("catalog", "listProducts")
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));
  };

  useEffect(load, []);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="NETRO-owned catalog (suppliers never shown to customers)"
        actions={
          can("catalog.write") ? (
            <Link className="btn" to="/products/new">
              Create product
            </Link>
          ) : null
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {!items.length && !error ? <LoadingBlock /> : null}
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Kind</th>
              <th>Price</th>
              <th>Flags</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.id}</td>
                <td>
                  <div className="font-semibold">{p.title_en}</div>
                  <div className="text-xs text-slate-500">{p.title_ar}</div>
                </td>
                <td>{p.kind}</td>
                <td>
                  {p.from_price} {p.display_currency}
                </td>
                <td className="text-xs text-slate-400">
                  {p.is_visible ? "visible" : "hidden"}
                  {p.is_featured ? " · featured" : ""}
                  {p.is_archived ? " · archived" : ""}
                </td>
                <td className="space-x-2 text-right">
                  <Link className="text-sm font-semibold text-blue-400" to={`/products/${p.id}`}>
                    Edit
                  </Link>
                  {can("catalog.write") ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-amber-400"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        void adminApi("catalog", "archiveProduct", { id: p.id })
                          .then(load)
                          .catch((err: unknown) =>
                            setError(err instanceof Error ? err.message : "Archive failed"),
                          )
                          .finally(() => setBusy(false));
                      }}
                    >
                      Archive
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, LoadingBlock, PageHeader } from "@/components/ui";

type ProductForm = {
  id: string;
  kind: "gift_card" | "direct_topup";
  brand_id: string;
  category_id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  color: string;
  tags: string[];
  from_price: number;
  display_currency: string;
  region_code: string;
  is_visible: boolean;
  is_featured: boolean;
  is_archived: boolean;
  sort_order: number;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
  payload: Record<string, unknown>;
};

const emptyProduct = (): ProductForm => ({
  id: "",
  kind: "gift_card",
  brand_id: "",
  category_id: "",
  title_en: "",
  title_ar: "",
  description_en: "",
  description_ar: "",
  color: "#111111",
  tags: [],
  from_price: 0,
  display_currency: "SAR",
  region_code: "GLOBAL",
  is_visible: true,
  is_featured: false,
  is_archived: false,
  sort_order: 0,
  seo_title_en: "",
  seo_title_ar: "",
  seo_description_en: "",
  seo_description_ar: "",
  payload: {},
});

export function ProductDetailPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const { can } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState<ProductForm>(emptyProduct());
  const [dens, setDens] = useState<Array<Record<string, unknown>>>([]);
  const [pkgs, setPkgs] = useState<Array<Record<string, unknown>>>([]);
  const [mappings, setMappings] = useState<Array<Record<string, unknown>>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void adminApi<{
      product: ProductForm;
      denominations: Array<Record<string, unknown>>;
      packages: Array<Record<string, unknown>>;
    }>("catalog", "getProduct", { id })
      .then((res) => {
        setForm({ ...emptyProduct(), ...res.product, tags: res.product.tags ?? [] });
        setDens(res.denominations);
        setPkgs(res.packages);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

    void adminApi<{ items: Array<Record<string, unknown>> }>("suppliers", "listMappings", {
      productId: id,
    }).then((res) => setMappings(res.items));

    void adminApi<{ items: Array<{ id: string; name: string; code: string }> }>("suppliers", "list").then(
      (res) => setSuppliers(res.items),
    );
  }, [id, isNew]);

  const saveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!can("catalog.write")) return;
    setBusy(true);
    setError(null);
    void adminApi("catalog", "upsertProduct", { product: form })
      .then(() => {
        if (isNew) nav(`/products/${form.id}`);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Save failed"))
      .finally(() => setBusy(false));
  };

  if (!isNew && !form.id && !error) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? "Create product" : form.title_en || form.id}
        subtitle="Bilingual catalog record owned by NETRO"
        actions={
          <Link to="/products" className="btn btn-secondary">
            Back
          </Link>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}

      <form className="card grid gap-3 md:grid-cols-2" onSubmit={saveProduct}>
        {(
          [
            ["id", "Product ID"],
            ["brand_id", "Brand ID"],
            ["category_id", "Category ID"],
            ["title_en", "Title EN"],
            ["title_ar", "Title AR"],
            ["description_en", "Description EN"],
            ["description_ar", "Description AR"],
            ["seo_title_en", "SEO title EN"],
            ["seo_title_ar", "SEO title AR"],
            ["seo_description_en", "SEO description EN"],
            ["seo_description_ar", "SEO description AR"],
            ["display_currency", "Currency"],
            ["region_code", "Region"],
            ["color", "Color"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="space-y-1 text-sm">
            <span className="text-slate-400">{label}</span>
            <input
              className="input"
              value={String(form[key] ?? "")}
              disabled={!can("catalog.write") || (!isNew && key === "id")}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required={key === "id" || key.startsWith("title")}
            />
          </label>
        ))}
        <label className="space-y-1 text-sm">
          <span className="text-slate-400">Kind</span>
          <select
            className="select"
            value={form.kind}
            disabled={!can("catalog.write") || !isNew}
            onChange={(e) =>
              setForm((f) => ({ ...f, kind: e.target.value as ProductForm["kind"] }))
            }
          >
            <option value="gift_card">gift_card</option>
            <option value="direct_topup">direct_topup</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-400">From price</span>
          <input
            className="input"
            type="number"
            value={form.from_price}
            disabled={!can("catalog.write")}
            onChange={(e) => setForm((f) => ({ ...f, from_price: Number(e.target.value) }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-400">Sort order</span>
          <input
            className="input"
            type="number"
            value={form.sort_order}
            disabled={!can("catalog.write")}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-slate-400">Tags (comma separated)</span>
          <input
            className="input"
            value={form.tags.join(", ")}
            disabled={!can("catalog.write")}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              }))
            }
          />
        </label>
        <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
          {(
            [
              ["is_visible", "Visible"],
              ["is_featured", "Featured"],
              ["is_archived", "Archived"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                disabled={!can("catalog.write")}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        {can("catalog.write") ? (
          <button className="btn md:col-span-2" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save product"}
          </button>
        ) : null}
      </form>

      {!isNew && form.kind === "gift_card" ? (
        <VariantSection
          title="Variants (denominations / SKUs)"
          rows={dens}
          canWrite={can("catalog.write")}
          onAdd={() => {
            const sku = `${form.id}-d-${Date.now()}`;
            const row = {
              id: sku,
              product_id: form.id,
              face_value: 0,
              price: 0,
              in_stock: true,
              is_active: true,
              sort_order: dens.length,
              label_en: "New denomination",
              label_ar: "فئة جديدة",
            };
            void adminApi("catalog", "upsertDenomination", { denomination: row }).then(() =>
              setDens((prev) => [...prev, row]),
            );
          }}
          onSave={(row) => adminApi("catalog", "upsertDenomination", { denomination: row })}
          onDelete={(sku) =>
            adminApi("catalog", "deleteDenomination", { id: sku }).then(() =>
              setDens((prev) => prev.filter((r) => r.id !== sku)),
            )
          }
          fields={["id", "label_en", "label_ar", "face_value", "price", "in_stock", "is_active", "sort_order"]}
        />
      ) : null}

      {!isNew && form.kind === "direct_topup" ? (
        <VariantSection
          title="Variants (packages / SKUs)"
          rows={pkgs}
          canWrite={can("catalog.write")}
          onAdd={() => {
            const sku = `${form.id}-p-${Date.now()}`;
            const row = {
              id: sku,
              product_id: form.id,
              label: "New package",
              amount: 0,
              price: 0,
              in_stock: true,
              is_active: true,
              sort_order: pkgs.length,
            };
            void adminApi("catalog", "upsertPackage", { package: row }).then(() =>
              setPkgs((prev) => [...prev, row]),
            );
          }}
          onSave={(row) => adminApi("catalog", "upsertPackage", { package: row })}
          onDelete={(sku) =>
            adminApi("catalog", "deletePackage", { id: sku }).then(() =>
              setPkgs((prev) => prev.filter((r) => r.id !== sku)),
            )
          }
          fields={["id", "label", "amount", "price", "in_stock", "is_active", "sort_order"]}
        />
      ) : null}

      {!isNew ? (
        <SupplierMappingSection
          productId={form.id}
          skus={[...dens, ...pkgs].map((r) => String(r.id))}
          suppliers={suppliers}
          mappings={mappings}
          canWrite={can("suppliers.write")}
          onReload={() =>
            void adminApi<{ items: Array<Record<string, unknown>> }>("suppliers", "listMappings", {
              productId: form.id,
            }).then((res) => setMappings(res.items))
          }
        />
      ) : null}
    </div>
  );
}

function VariantSection({
  title,
  rows,
  fields,
  canWrite,
  onAdd,
  onSave,
  onDelete,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  fields: string[];
  canWrite: boolean;
  onAdd: () => void;
  onSave: (row: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const [drafts, setDrafts] = useState(rows);
  useEffect(() => setDrafts(rows), [rows]);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        {canWrite ? (
          <button type="button" className="btn btn-secondary" onClick={onAdd}>
            Add variant
          </button>
        ) : null}
      </div>
      {drafts.map((row, index) => (
        <div key={String(row.id)} className="grid gap-2 rounded-xl border border-slate-800 p-3 md:grid-cols-4">
          {fields.map((field) => (
            <label key={field} className="space-y-1 text-xs">
              <span className="text-slate-500">{field}</span>
              <input
                className="input"
                disabled={!canWrite || field === "id"}
                value={String(row[field] ?? "")}
                onChange={(e) => {
                  const value =
                    field.includes("price") ||
                    field.includes("amount") ||
                    field.includes("face_value") ||
                    field.includes("sort")
                      ? Number(e.target.value)
                      : field === "in_stock" || field === "is_active"
                        ? e.target.value === "true"
                        : e.target.value;
                  setDrafts((prev) =>
                    prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
                  );
                }}
              />
            </label>
          ))}
          {canWrite ? (
            <div className="flex items-end gap-2 md:col-span-4">
              <button
                type="button"
                className="btn"
                onClick={() => void onSave(drafts[index]!)}
              >
                Save variant
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void onDelete(String(row.id))}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SupplierMappingSection({
  productId,
  skus,
  suppliers,
  mappings,
  canWrite,
  onReload,
}: {
  productId: string;
  skus: string[];
  suppliers: Array<{ id: string; name: string; code: string }>;
  mappings: Array<Record<string, unknown>>;
  canWrite: boolean;
  onReload: () => void;
}) {
  const [sku, setSku] = useState(skus[0] ?? "");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [ref, setRef] = useState("");
  const [priority, setPriority] = useState(1);

  useEffect(() => {
    if (!sku && skus[0]) setSku(skus[0]);
  }, [skus, sku]);
  useEffect(() => {
    if (!supplierId && suppliers[0]) setSupplierId(suppliers[0].id);
  }, [suppliers, supplierId]);

  return (
    <div className="card space-y-3">
      <h2 className="font-bold">Supplier mappings (priority routing)</h2>
      <p className="text-xs text-slate-500">
        Multiple suppliers per SKU. Lower priority number = tried first. Costs never leave admin.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Supplier</th>
            <th>Ref</th>
            <th>Cost</th>
            <th>Priority</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {mappings.map((m) => (
            <tr key={String(m.id)}>
              <td className="font-mono text-xs">{String(m.sku)}</td>
              <td>{String((m.suppliers as { name?: string } | null)?.name ?? m.supplier_id)}</td>
              <td className="font-mono text-xs">{String(m.supplier_product_ref)}</td>
              <td>
                {m.supplier_cost != null ? `${m.supplier_cost} ${m.currency}` : "—"}
              </td>
              <td>{String(m.priority)}</td>
              <td>{m.is_active ? "yes" : "no"}</td>
              <td>
                {canWrite ? (
                  <button
                    type="button"
                    className="text-sm text-red-400"
                    onClick={() =>
                      void adminApi("suppliers", "deleteMapping", { id: m.id }).then(onReload)
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {canWrite ? (
        <div className="grid gap-2 md:grid-cols-5">
          <select className="select" value={sku} onChange={(e) => setSku(e.target.value)}>
            {skus.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Supplier product ref"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
          <input
            className="input"
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
          <button
            type="button"
            className="btn"
            onClick={() =>
              void adminApi("suppliers", "upsertMapping", {
                mapping: {
                  product_id: productId,
                  sku,
                  supplier_id: supplierId,
                  supplier_product_ref: ref,
                  supplier_sku: ref,
                  priority,
                  is_active: true,
                  currency: "SAR",
                },
              }).then(onReload)
            }
          >
            Add mapping
          </button>
        </div>
      ) : null}
    </div>
  );
}

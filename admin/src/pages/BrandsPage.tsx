import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, PageHeader } from "@/components/ui";
import { adminApi } from "@/lib/api";

type Category = { id: string; name_en: string };
type Brand = {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  color: string;
  primary_category_id: string | null;
  is_hidden: boolean;
};
type Region = {
  code: string;
  name_en: string;
  name_ar: string;
  currency_code: string;
  is_active: boolean;
};
type Offering = {
  id: string;
  brand_id: string;
  kind: "gift_card" | "direct_topup";
  region_id: string;
  title_en: string;
  is_visible: boolean;
  is_archived: boolean;
};

const emptyBrand = (): Brand => ({
  id: "",
  name_en: "",
  name_ar: "",
  slug: "",
  color: "#111111",
  primary_category_id: null,
  is_hidden: false,
});

const emptyRegion = (): Region => ({
  code: "",
  name_en: "",
  name_ar: "",
  currency_code: "SAR",
  is_active: true,
});

export function BrandsPage() {
  const { can } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [brandDraft, setBrandDraft] = useState<Brand>(emptyBrand());
  const [regionDraft, setRegionDraft] = useState<Region>(emptyRegion());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    void Promise.all([
      adminApi<{ items: Brand[] }>("catalog", "listBrands"),
      adminApi<{ items: Category[] }>("catalog", "listCategories"),
      adminApi<{ items: Region[] }>("catalog", "listRegions"),
      adminApi<{ items: Offering[] }>("catalog", "listProducts", { limit: 1000 }),
    ])
      .then(([brandResult, categoryResult, regionResult, productResult]) => {
        setBrands(brandResult.items);
        setCategories(categoryResult.items);
        setRegions(regionResult.items);
        setOfferings(productResult.items);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Failed"));
  }, []);

  useEffect(load, [load]);

  const offeringsByBrand = useMemo(() => {
    const result = new Map<string, Offering[]>();
    for (const offering of offerings) {
      result.set(offering.brand_id, [...(result.get(offering.brand_id) ?? []), offering]);
    }
    return result;
  }, [offerings]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands & regions"
        subtitle="One canonical brand with regional offerings and sellable variants"
      />
      {error ? <ErrorBanner message={error} /> : null}

      {can("catalog.write") ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <form
            className="card grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void adminApi("catalog", "upsertBrand", { brand: brandDraft }).then(() => {
                setBrandDraft(emptyBrand());
                load();
              });
            }}
          >
            <h2 className="md:col-span-2 font-bold">Create canonical brand</h2>
            {(["id", "slug", "name_en", "name_ar", "color"] as const).map((key) => (
              <input
                key={key}
                className="input"
                placeholder={key}
                value={String(brandDraft[key] ?? "")}
                onChange={(event) =>
                  setBrandDraft((draft) => ({ ...draft, [key]: event.target.value }))
                }
                required
              />
            ))}
            <select
              className="select"
              value={brandDraft.primary_category_id ?? ""}
              onChange={(event) =>
                setBrandDraft((draft) => ({
                  ...draft,
                  primary_category_id: event.target.value || null,
                }))
              }
              required
            >
              <option value="">Primary category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_en}
                </option>
              ))}
            </select>
            <button className="btn" type="submit">
              Save brand
            </button>
          </form>

          <form
            className="card grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void adminApi("catalog", "upsertRegion", { region: regionDraft }).then(() => {
                setRegionDraft(emptyRegion());
                load();
              });
            }}
          >
            <h2 className="md:col-span-2 font-bold">Add region</h2>
            {(["code", "name_en", "name_ar", "currency_code"] as const).map((key) => (
              <input
                key={key}
                className="input"
                placeholder={key}
                value={String(regionDraft[key])}
                onChange={(event) =>
                  setRegionDraft((draft) => ({ ...draft, [key]: event.target.value }))
                }
                required
              />
            ))}
            <button className="btn md:col-span-2" type="submit">
              Save region
            </button>
          </form>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <section className="card overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Category → Brand → Region offerings</h2>
            {can("catalog.write") ? (
              <Link to="/products/new" className="btn">
                Add offering
              </Link>
            ) : null}
          </div>
          <div className="space-y-3">
            {brands.map((brand) => {
              const brandOfferings = offeringsByBrand.get(brand.id) ?? [];
              return (
                <div key={brand.id} className="rounded-xl border border-slate-800 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold">
                        {brand.name_en} / {brand.name_ar}
                      </div>
                      <div className="font-mono text-xs text-slate-500">{brand.id}</div>
                    </div>
                    <Link
                      className="btn btn-secondary"
                      to={`/products/new?brandId=${encodeURIComponent(brand.id)}&categoryId=${encodeURIComponent(
                        brand.primary_category_id ?? "",
                      )}`}
                    >
                      Add region offering
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brandOfferings.length ? (
                      brandOfferings.map((offering) => (
                        <Link
                          key={offering.id}
                          to={`/products/${offering.id}`}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs"
                        >
                          {offering.region_id} · {offering.kind}
                          {offering.is_archived ? " · archived" : ""}
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No regional offerings</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h2 className="mb-3 font-bold">Regions</h2>
          <div className="space-y-2">
            {regions.map((region) => (
              <div
                key={region.code}
                className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2"
              >
                <span>
                  <span className="font-semibold">{region.name_en}</span>
                  <span className="block text-xs text-slate-500">
                    {region.code} · {region.currency_code}
                  </span>
                </span>
                <span className="text-xs text-slate-500">
                  {region.is_active ? "active" : "inactive"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


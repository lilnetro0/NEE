import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, PageHeader } from "@/components/ui";

type Category = {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  sort_order: number;
  is_hidden?: boolean;
  image_path?: string | null;
};

export function CategoriesPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Category>({
    id: "",
    name_en: "",
    name_ar: "",
    slug: "",
    sort_order: 0,
    is_hidden: false,
  });
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<{ items: Category[] }>("catalog", "listCategories")
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Categories" subtitle="Browse taxonomy" />
      {error ? <ErrorBanner message={error} /> : null}
      {can("catalog.write") ? (
        <form
          className="card grid gap-2 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            void adminApi("catalog", "upsertCategory", { category: draft }).then(() => {
              setDraft({
                id: "",
                name_en: "",
                name_ar: "",
                slug: "",
                sort_order: 0,
                is_hidden: false,
              });
              load();
            });
          }}
        >
          {(["id", "slug", "name_en", "name_ar"] as const).map((key) => (
            <input
              key={key}
              className="input"
              placeholder={key}
              value={String(draft[key] ?? "")}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              required
            />
          ))}
          <button className="btn" type="submit">
            Save category
          </button>
        </form>
      ) : null}
      <div className="card overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Sort</th>
              <th>Hidden</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.id}</td>
                <td>
                  {c.name_en} / {c.name_ar}
                </td>
                <td>{c.sort_order}</td>
                <td>{c.is_hidden ? "yes" : "no"}</td>
                <td className="text-right">
                  {can("catalog.write") ? (
                    <button
                      type="button"
                      className="text-sm text-red-400"
                      onClick={() =>
                        void adminApi("catalog", "deleteCategory", { id: c.id }).then(load)
                      }
                    >
                      Delete
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

import { describe, expect, it } from "vitest";
import { mapBrand, mapCategory, mapProduct, mapRegion } from "./mappers";
import type { Database } from "@/types/database";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type RegionRow = Database["public"]["Tables"]["regions"]["Row"];
type DenominationRow = Database["public"]["Tables"]["denominations"]["Row"];

const category: CategoryRow = {
  id: "cat-cards",
  slug: "gift-cards",
  name_en: "Gift Cards",
  name_ar: "بطاقات الهدايا",
  sort_order: 1,
  image_path: null,
  is_hidden: false,
  created_at: "2026-07-18T00:00:00.000Z",
};

const brand: BrandRow = {
  id: "brand-apple",
  slug: "apple",
  name_en: "Apple",
  name_ar: "Apple",
  color: "#111111",
  image_path: null,
  is_hidden: false,
  primary_category_id: category.id,
  created_at: "2026-07-18T00:00:00.000Z",
};

const region: RegionRow = {
  code: "SA",
  name_en: "Saudi Arabia",
  name_ar: "السعودية",
  currency_code: "SAR",
  sort_order: 10,
  is_active: true,
  created_at: "2026-07-18T00:00:00.000Z",
};

const product: ProductRow = {
  id: "prod-apple-sa",
  kind: "gift_card",
  brand_id: brand.id,
  category_id: category.id,
  title_en: "Apple Gift Card",
  title_ar: "بطاقة Apple",
  subtitle_en: null,
  subtitle_ar: null,
  description_en: "",
  description_ar: "",
  color: "#111111",
  rating: 0,
  reviews_count: 0,
  in_stock: true,
  tags: [],
  from_price: 10,
  compare_at: null,
  display_currency: "SAR",
  region_code: "SA",
  region_id: "SA",
  payload: {},
  is_visible: true,
  is_featured: false,
  is_archived: false,
  sort_order: 0,
  image_path: null,
  seo_title_en: null,
  seo_title_ar: null,
  seo_description_en: null,
  seo_description_ar: null,
  created_at: "2026-07-18T00:00:00.000Z",
  updated_at: "2026-07-18T00:00:00.000Z",
};

const denomination: DenominationRow = {
  id: "den-apple-sa-10",
  product_id: product.id,
  face_value: 10,
  price: 10,
  in_stock: true,
  sort_order: 0,
  is_active: true,
  label_en: "10 SAR",
  label_ar: "10 ر.س",
};

describe("catalog hierarchy mappers", () => {
  it("preserves stable ids and exposes canonical slugs", () => {
    expect(mapCategory(category)).toMatchObject({ id: "cat-cards", slug: "gift-cards" });
    expect(mapBrand(brand)).toMatchObject({
      id: "brand-apple",
      slug: "apple",
      primaryCategoryId: "cat-cards",
    });
  });

  it("maps a first-class localized region onto a regional offering", () => {
    const mapped = mapProduct(product, [denomination], [], [], region);
    expect(mapped.id).toBe("prod-apple-sa");
    expect(mapped.region).toEqual({
      code: "SA",
      name: { en: "Saudi Arabia", ar: "السعودية" },
      currencyCode: "SAR",
    });
    expect(mapped.kind).toBe("gift_card");
    if (mapped.kind === "gift_card") {
      expect(mapped.denominations[0]?.id).toBe("den-apple-sa-10");
    }
  });

  it("does not expose supplier catalog fields in customer domain objects", () => {
    const mapped = mapProduct(product, [denomination], [], [], region);
    expect("supplierId" in mapped).toBe(false);
    expect("supplierProductId" in mapped).toBe(false);
    expect(mapRegion(region).name.ar).toBe("السعودية");
  });
});

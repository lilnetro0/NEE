import type { Localized } from "./common";

export type Category = {
  id: string;
  slug?: string;
  name: Localized;
  icon: string;
  color: string;
  imagePath?: string;
};

export type Brand = {
  id: string;
  slug?: string;
  name: string;
  localizedName?: Localized;
  color: string;
  logo: string;
  imagePath?: string;
  primaryCategoryId?: string;
};

export type BrandListParams = {
  categoryId?: string;
  regionId?: string;
  platform?: string;
  q?: string;
  featured?: boolean;
  popular?: boolean;
  limit?: number;
};

import type { Localized } from "./common";

export type Category = {
  id: string;
  name: Localized;
  icon: string;
  color: string;
};

export type Brand = {
  id: string;
  name: string;
  color: string;
  logo: string;
};

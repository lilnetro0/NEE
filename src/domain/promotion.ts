import type { IsoDateTime, Localized } from "./common";

export type Promotion = {
  id: string;
  code: string;
  title: Localized;
  expiresLabel: Localized;
  expiresAt?: IsoDateTime;
};

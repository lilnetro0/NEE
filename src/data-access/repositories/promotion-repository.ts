import type { Promotion } from "@/domain/promotion";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type PromotionRepository = {
  list(options?: RequestOptions): Promise<Result<Promotion[]>>;
};

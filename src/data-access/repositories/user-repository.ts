import type { User } from "@/domain/user";
import type { StoreCredit } from "@/domain/order";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

/**
 * Non-auth user profile / wallet reads.
 * Session, OTP, reauth, and account-security mutations live on AuthRepository.
 */
export type UserRepository = {
  getCurrent(options?: RequestOptions): Promise<Result<User>>;
  getStoreCredit(options?: RequestOptions): Promise<Result<StoreCredit>>;
};

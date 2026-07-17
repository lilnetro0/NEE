import type { User } from "@/domain/user";
import type { StoreCredit } from "@/domain/order";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type AuthSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
};

export type ReauthResult = {
  token: string;
  expiresAt: string;
};

export type UserRepository = {
  getCurrent(options?: RequestOptions): Promise<Result<User>>;
  getStoreCredit(options?: RequestOptions): Promise<Result<StoreCredit>>;
  reauth(password: string, options?: RequestOptions): Promise<Result<ReauthResult>>;
  listSessions(options?: RequestOptions): Promise<Result<AuthSession[]>>;
  revokeSession(id: string, options?: RequestOptions): Promise<Result<void>>;
  deleteAccount(password: string, options?: RequestOptions): Promise<Result<void>>;
  requestEmailChange(email: string, options?: RequestOptions): Promise<Result<void>>;
  verifyEmailChange(code: string, options?: RequestOptions): Promise<Result<void>>;
  requestPhoneChange(phone: string, options?: RequestOptions): Promise<Result<void>>;
  verifyPhoneChange(code: string, options?: RequestOptions): Promise<Result<void>>;
};

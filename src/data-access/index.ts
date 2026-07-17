export type * from "./result";
export type * from "./options";
export type {
  NotificationRepository,
  OrderRepository,
  ProductRepository,
  PromotionRepository,
  SupportRepository,
  UserRepository,
  Repositories,
} from "./repositories";
export type { AuthRepository } from "./repositories/auth-repository";
export type { DeviceSession as AuthSession } from "@/domain/auth";
export { RepositoriesProvider, useRepositories } from "./RepositoriesProvider";
export { createMockRepositories } from "./mock/create-mock-repositories";
export {
  createHttpRepositories,
  createRepositoriesFromEnv,
  type RepositoryMode,
} from "./http/create-http-repositories";
export { NetroApiClient, getApiClient } from "./http/api-client";
export { MOCK_OTP_VALID, MOCK_OTP_EXPIRED } from "./mock/mock-auth-repository";
export { useResultQuery } from "./hooks/useResultQuery";
export {
  useProducts,
  useProduct,
  useCategories,
  useCategory,
  useBrands,
  useBrand,
  useVerifyAccount,
} from "./hooks/useCatalog";
export { useOrders, useOrder, useOrderMutations } from "./hooks/useOrders";
export {
  useNotifications,
  useCurrentUser,
  useStoreCreditQuery,
  usePromotions,
} from "./hooks/useUserData";
export { useUserActions } from "./hooks/useUserActions";
export {
  useSupportTickets,
  useSupportTicket,
  useSupportMutations,
} from "./hooks/useSupportTickets";

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
export {
  createSupabaseRepositories,
  createRepositoriesFromEnv,
  type RepositoryMode,
} from "./supabase/create-supabase-repositories";
export { useResultQuery } from "./hooks/useResultQuery";
export {
  useProducts,
  useProduct,
  useCategories,
  useCategory,
  useBrands,
  useBrand,
  useRegions,
  useBrandRegions,
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

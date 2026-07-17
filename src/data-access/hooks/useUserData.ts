import { useRepositories } from "../RepositoriesProvider";
import { useResultQuery } from "./useResultQuery";

export function useNotifications() {
  const { notifications } = useRepositories();
  return useResultQuery((signal) => notifications.list({ signal }), [notifications]);
}

export function useCurrentUser() {
  const { users } = useRepositories();
  return useResultQuery((signal) => users.getCurrent({ signal }), [users]);
}

export function useStoreCreditQuery() {
  const { users } = useRepositories();
  return useResultQuery((signal) => users.getStoreCredit({ signal }), [users]);
}

export function usePromotions() {
  const { promotions } = useRepositories();
  return useResultQuery((signal) => promotions.list({ signal }), [promotions]);
}

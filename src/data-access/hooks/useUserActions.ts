import { useCallback } from "react";
import { useRepositories } from "../RepositoriesProvider";

export function useUserActions() {
  const { users } = useRepositories();
  return {
    reauth: useCallback((password: string) => users.reauth(password), [users]),
    listSessions: useCallback(
      (signal?: AbortSignal) => users.listSessions({ signal }),
      [users],
    ),
    revokeSession: useCallback((id: string) => users.revokeSession(id), [users]),
    deleteAccount: useCallback((password: string) => users.deleteAccount(password), [users]),
    requestEmailChange: useCallback(
      (email: string) => users.requestEmailChange(email),
      [users],
    ),
    verifyEmailChange: useCallback((code: string) => users.verifyEmailChange(code), [users]),
    requestPhoneChange: useCallback(
      (phone: string) => users.requestPhoneChange(phone),
      [users],
    ),
    verifyPhoneChange: useCallback((code: string) => users.verifyPhoneChange(code), [users]),
  };
}

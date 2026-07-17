import { useCallback } from "react";
import { useRepositories } from "../RepositoriesProvider";

/** Account / session actions via AuthRepository (not UserRepository). */
export function useUserActions() {
  const { auth } = useRepositories();
  return {
    reauth: useCallback((password: string) => auth.reauth(password), [auth]),
    listSessions: useCallback((signal?: AbortSignal) => auth.listSessions({ signal }), [auth]),
    revokeSession: useCallback((id: string) => auth.revokeSession(id), [auth]),
    deleteAccount: useCallback((password: string) => auth.deleteAccount(password), [auth]),
    requestEmailChange: useCallback((email: string) => auth.requestEmailChange(email), [auth]),
    verifyEmailChange: useCallback(
      (challengeId: string, code: string) => auth.verifyEmailChange({ challengeId, code }),
      [auth],
    ),
    requestPhoneChange: useCallback((phone: string) => auth.requestPhoneChange(phone), [auth]),
    verifyPhoneChange: useCallback(
      (challengeId: string, code: string) => auth.verifyPhoneChange({ challengeId, code }),
      [auth],
    ),
  };
}

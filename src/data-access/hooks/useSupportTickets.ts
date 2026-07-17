import { useCallback } from "react";
import { useRepositories } from "../RepositoriesProvider";
import { useResultQuery } from "./useResultQuery";

export function useSupportTickets() {
  const { support } = useRepositories();
  return useResultQuery((signal) => support.list({ signal }), [support]);
}

export function useSupportTicket(id: string) {
  const { support } = useRepositories();
  return useResultQuery((signal) => support.getById(id, { signal }), [support, id]);
}

export function useSupportMutations() {
  const { support } = useRepositories();
  return {
    submit: useCallback(
      (
        ticket: Parameters<typeof support.submit>[0],
        options?: Parameters<typeof support.submit>[1],
      ) => support.submit(ticket, options),
      [support],
    ),
  };
}

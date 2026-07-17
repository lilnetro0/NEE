import { useEffect } from "react";
import { useRepositories } from "../RepositoriesProvider";
import { useResultQuery } from "./useResultQuery";
import { getSupabaseClient } from "@/lib/supabase";

export function useNotifications() {
  const { notifications } = useRepositories();
  const query = useResultQuery((signal) => notifications.list({ signal }), [notifications]);
  const { reload } = query;

  useEffect(() => {
    const supabase = getSupabaseClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      channel = supabase
        .channel(`notifications:${data.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${data.user.id}`,
          },
          () => {
            reload();
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [reload]);

  return query;
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

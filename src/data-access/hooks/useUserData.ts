import { useEffect } from "react";
import { useRepositories } from "../RepositoriesProvider";
import { useResultQuery } from "./useResultQuery";
import { getSupabaseClient } from "@/lib/supabase";

export function useNotifications() {
  const { notifications } = useRepositories();
  const query = useResultQuery(["notifications"], (signal) => notifications.list({ signal }));
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
  return useResultQuery(["currentUser"], (signal) => users.getCurrent({ signal }));
}

export function useStoreCreditQuery() {
  const { users } = useRepositories();
  return useResultQuery(["storeCredit"], (signal) => users.getStoreCredit({ signal }));
}

export function usePromotions() {
  const { promotions } = useRepositories();
  return useResultQuery(["promotions"], (signal) => promotions.list({ signal }));
}

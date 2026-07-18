import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Navigating back to a screen shows cached data instantly; a background
        // refetch runs only when data is older than a minute.
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Start loading the destination route's code on touchstart/hover so the
    // tap itself feels instant.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Subtle cross-fade between screens where the View Transitions API is
    // available (iOS 18+ / modern Chrome); older engines navigate instantly.
    defaultViewTransition: true,
  });

  return router;
};

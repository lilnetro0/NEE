import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";
import { getPublicEnv } from "@/config/env";
import type { Database } from "@/types/database";
import type { SecureStorage } from "@/platform/contracts";

export type NetroSupabaseClient = SupabaseClient<Database>;

let client: NetroSupabaseClient | null = null;
let storageBridge: SecureStorage | null = null;

/**
 * Inject platform secureStorage before first getSupabaseClient() call
 * (AuthProvider / RepositoriesProvider bootstrap). Falls back to in-memory
 * so tokens never land in localStorage.
 */
export function configureSupabaseAuthStorage(secureStorage: SecureStorage): void {
  storageBridge = secureStorage;
  client = null;
}

function createMemoryFallback(): Map<string, string> {
  return new Map();
}

const memory = createMemoryFallback();

function createAuthStorage(): SupportedStorage {
  return {
    getItem: async (key: string) => {
      if (storageBridge) {
        return storageBridge.get(key);
      }
      return memory.get(key) ?? null;
    },
    setItem: async (key: string, value: string) => {
      if (storageBridge) {
        await storageBridge.set(key, value);
        return;
      }
      memory.set(key, value);
    },
    removeItem: async (key: string) => {
      if (storageBridge) {
        await storageBridge.remove(key);
        return;
      }
      memory.delete(key);
    },
  };
}

export function getSupabaseClient(): NetroSupabaseClient {
  if (client) return client;
  const env = getPublicEnv();
  client = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      storage: createAuthStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return client;
}

/** Test helper. */
export function __resetSupabaseClientForTests(): void {
  client = null;
  storageBridge = null;
  memory.clear();
}

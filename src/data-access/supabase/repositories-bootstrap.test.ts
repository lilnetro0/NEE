import { describe, expect, it, beforeEach } from "vitest";
import { __resetPublicEnvForTests, loadPublicEnv } from "@/config/env";
import { createRepositoriesFromEnv } from "@/data-access/supabase/create-supabase-repositories";
import { __resetSupabaseClientForTests } from "@/lib/supabase";

describe("createRepositoriesFromEnv", () => {
  beforeEach(() => {
    __resetPublicEnvForTests(null);
    __resetSupabaseClientForTests();
  });

  it("bootstraps Supabase repositories when env is valid", () => {
    const env = loadPublicEnv({
      viteProd: false,
      get: (key) => {
        if (key === "VITE_APP_ENV") return "development";
        if (key === "VITE_SUPABASE_URL") return "https://example.supabase.co";
        if (key === "VITE_SUPABASE_PUBLISHABLE_KEY") return "anon-key";
        return undefined;
      },
    });
    __resetPublicEnvForTests(env);

    const { mode, repositories } = createRepositoriesFromEnv();
    expect(mode).toBe("supabase");
    expect(repositories.auth).toBeDefined();
    expect(repositories.products).toBeDefined();
    expect(repositories.orders).toBeDefined();
    expect(repositories.users).toBeDefined();
    expect(repositories.notifications).toBeDefined();
    expect(repositories.support).toBeDefined();
    expect(repositories.promotions).toBeDefined();
  });
});

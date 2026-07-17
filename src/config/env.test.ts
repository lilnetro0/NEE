import { describe, expect, it, beforeEach } from "vitest";
import { __resetPublicEnvForTests, loadPublicEnv, EnvConfigError } from "@/config/env";

describe("loadPublicEnv", () => {
  beforeEach(() => {
    __resetPublicEnvForTests(null);
  });

  it("requires Supabase URL and publishable key", () => {
    expect(() =>
      loadPublicEnv({
        viteProd: false,
        get: (key) => {
          if (key === "VITE_APP_ENV") return "development";
          return undefined;
        },
      }),
    ).toThrow(EnvConfigError);
  });

  it("accepts development Supabase configuration", () => {
    const env = loadPublicEnv({
      viteProd: false,
      get: (key) => {
        if (key === "VITE_APP_ENV") return "development";
        if (key === "VITE_SUPABASE_URL") return "https://example.supabase.co/";
        if (key === "VITE_SUPABASE_PUBLISHABLE_KEY") return "anon-key";
        return undefined;
      },
    });
    expect(env.supabaseUrl).toBe("https://example.supabase.co");
    expect(env.supabasePublishableKey).toBe("anon-key");
    expect(env.enableDevTools).toBe(true);
  });

  it("rejects localhost Supabase URL in production", () => {
    expect(() =>
      loadPublicEnv({
        viteProd: true,
        get: (key) => {
          if (key === "VITE_APP_ENV") return "production";
          if (key === "VITE_SUPABASE_URL") return "http://localhost:54321";
          if (key === "VITE_SUPABASE_PUBLISHABLE_KEY") return "anon-key";
          return undefined;
        },
      }),
    ).toThrow(/localhost/i);
  });

  it("accepts production Supabase configuration", () => {
    const env = loadPublicEnv({
      viteProd: true,
      get: (key) => {
        if (key === "VITE_APP_ENV") return "production";
        if (key === "VITE_SUPABASE_URL") return "https://xyz.supabase.co";
        if (key === "VITE_SUPABASE_PUBLISHABLE_KEY") return "anon-key";
        if (key === "VITE_APP_VERSION") return "1.2.3";
        if (key === "VITE_BUILD_SHA") return "abc123";
        return undefined;
      },
    });
    expect(env.enableDevTools).toBe(false);
    expect(env.appVersion).toBe("1.2.3");
    expect(env.buildSha).toBe("abc123");
  });
});

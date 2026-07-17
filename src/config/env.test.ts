import { describe, expect, it, beforeEach } from "vitest";
import { __resetPublicEnvForTests, loadPublicEnv, EnvConfigError } from "@/config/env";

describe("loadPublicEnv", () => {
  beforeEach(() => {
    __resetPublicEnvForTests(null);
  });

  it("defaults to mocks in development", () => {
    const env = loadPublicEnv({
      viteProd: false,
      get: (key) => {
        if (key === "VITE_APP_ENV") return "development";
        return undefined;
      },
    });
    expect(env.useMocks).toBe(true);
    expect(env.apiBaseUrl).toBeNull();
    expect(env.enableDevTools).toBe(true);
  });

  it("requires API URL when mocks are disabled", () => {
    expect(() =>
      loadPublicEnv({
        viteProd: false,
        get: (key) => {
          if (key === "VITE_USE_MOCKS") return "false";
          return undefined;
        },
      }),
    ).toThrow(EnvConfigError);
  });

  it("rejects mocks in production", () => {
    expect(() =>
      loadPublicEnv({
        viteProd: true,
        get: (key) => {
          if (key === "VITE_APP_ENV") return "production";
          if (key === "VITE_USE_MOCKS") return "true";
          if (key === "VITE_API_BASE_URL") return "https://api.example.com";
          return undefined;
        },
      }),
    ).toThrow(/cannot use mock/i);
  });

  it("rejects localhost API URL in production", () => {
    expect(() =>
      loadPublicEnv({
        viteProd: true,
        get: (key) => {
          if (key === "VITE_APP_ENV") return "production";
          if (key === "VITE_USE_MOCKS") return "false";
          if (key === "VITE_API_BASE_URL") return "http://localhost:3000";
          return undefined;
        },
      }),
    ).toThrow(/localhost/i);
  });

  it("accepts production HTTP configuration", () => {
    const env = loadPublicEnv({
      viteProd: true,
      get: (key) => {
        if (key === "VITE_APP_ENV") return "production";
        if (key === "VITE_USE_MOCKS") return "false";
        if (key === "VITE_API_BASE_URL") return "https://api.netro.app/";
        if (key === "VITE_APP_VERSION") return "1.2.3";
        if (key === "VITE_BUILD_SHA") return "abc123";
        return undefined;
      },
    });
    expect(env.useMocks).toBe(false);
    expect(env.apiBaseUrl).toBe("https://api.netro.app");
    expect(env.enableDevTools).toBe(false);
    expect(env.appVersion).toBe("1.2.3");
    expect(env.buildSha).toBe("abc123");
  });
});

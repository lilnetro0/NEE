import { describe, expect, it, beforeEach, vi } from "vitest";
import { __resetPublicEnvForTests, loadPublicEnv } from "@/config/env";
import { createRepositoriesFromEnv } from "@/data-access/http/create-http-repositories";
import { __resetApiClientForTests } from "@/data-access/http/api-client";

describe("createRepositoriesFromEnv", () => {
  beforeEach(() => {
    __resetPublicEnvForTests(null);
    __resetApiClientForTests();
    vi.restoreAllMocks();
  });

  it("selects mock repositories when VITE_USE_MOCKS=true in development", () => {
    __resetPublicEnvForTests(
      loadPublicEnv({
        viteProd: false,
        get: (key) => {
          if (key === "VITE_APP_ENV") return "development";
          if (key === "VITE_USE_MOCKS") return "true";
          return undefined;
        },
      }),
    );
    const { mode } = createRepositoriesFromEnv();
    expect(mode).toBe("mock");
  });

  it("selects HTTP repositories when mocks are disabled", () => {
    __resetPublicEnvForTests(
      loadPublicEnv({
        viteProd: false,
        get: (key) => {
          if (key === "VITE_APP_ENV") return "preview";
          if (key === "VITE_USE_MOCKS") return "false";
          if (key === "VITE_API_BASE_URL") return "https://api.netro.app";
          return undefined;
        },
      }),
    );
    const { mode, repositories } = createRepositoriesFromEnv();
    expect(mode).toBe("http");
    expect(repositories.products).toBeDefined();
    expect(repositories.orders).toBeDefined();
  });

  it("does not silently fall back to mocks in production", () => {
    expect(() =>
      loadPublicEnv({
        viteProd: true,
        get: (key) => {
          if (key === "VITE_APP_ENV") return "production";
          if (key === "VITE_USE_MOCKS") return "true";
          if (key === "VITE_API_BASE_URL") return "https://api.netro.app";
          return undefined;
        },
      }),
    ).toThrow(/cannot use mock/i);
  });
});

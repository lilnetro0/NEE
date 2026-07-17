import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { NetroApiClient, __resetApiClientForTests } from "@/data-access/http/api-client";
import { __resetPublicEnvForTests, loadPublicEnv } from "@/config/env";

describe("NetroApiClient error normalization", () => {
  beforeEach(() => {
    __resetApiClientForTests();
    __resetPublicEnvForTests(
      loadPublicEnv({
        viteProd: false,
        get: (key) => {
          if (key === "VITE_USE_MOCKS") return "false";
          if (key === "VITE_API_BASE_URL") return "https://api.netro.app";
          return undefined;
        },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubFetch(status: number, body: unknown = { message: "fail" }) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(body),
      })),
    );
  }

  it("maps 401 to unauthorized and invokes onUnauthorized", async () => {
    const onUnauthorized = vi.fn();
    stubFetch(401);
    const client = new NetroApiClient({ onUnauthorized });
    const result = await client.get("/v1/me");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unauthorized");
      expect(result.error.message).toBe("UNAUTHORIZED");
    }
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("maps 404 / 409 / 422 / 429 / 500 correctly", async () => {
    const cases = [
      [404, "not_found"],
      [409, "conflict"],
      [422, "validation"],
      [429, "rate_limited"],
      [503, "unavailable"],
    ] as const;

    for (const [status, code] of cases) {
      stubFetch(status, { code: `E_${status}`, message: "x" });
      const client = new NetroApiClient();
      const result = await client.get("/v1/x");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(code);
    }
  });

  it("does not retry POST requests", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("network");
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new NetroApiClient();
    await client.post("/v1/orders", { quoteId: "q1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries safe GET on network failure", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) throw new TypeError("network");
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true }),
        };
      }),
    );
    const client = new NetroApiClient();
    const result = await client.get("/v1/products");
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });
});

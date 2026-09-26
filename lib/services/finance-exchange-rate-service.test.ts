import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const repo = vi.hoisted(() => ({
  findRecentRate: vi.fn(),
  findLatestRate: vi.fn(),
  insertRate: vi.fn(),
}));
vi.mock("@/lib/repositories/finance-exchange-rate-repository", () => repo);

import { getUsdToKrwRate } from "@/lib/services/finance-exchange-rate-service";

describe("getUsdToKrwRate", () => {
  beforeEach(() => {
    repo.findRecentRate.mockResolvedValue(null);
    repo.findLatestRate.mockResolvedValue(null);
    repo.insertRate.mockResolvedValue(undefined);
    vi.stubEnv("EXCHANGE_RATE_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("returns a fresh cached rate without calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    repo.findRecentRate.mockResolvedValue({ rate: 1400, fetchedAt: "2026-09-27T00:00:00Z" });

    await expect(getUsdToKrwRate()).resolves.toMatchObject({ rate: 1400, cached: true, fallback: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores and returns a live rate", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: "success", conversion_rate: 1388.5 })));

    await expect(getUsdToKrwRate()).resolves.toMatchObject({ rate: 1388.5, cached: false, fallback: false });
    expect(repo.insertRate).toHaveBeenCalledWith("USD", "KRW", 1388.5, expect.any(String));
  });

  it("passes an abort signal so a hung provider is bounded", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ result: "success", conversion_rate: 1390 }));
    vi.stubGlobal("fetch", fetchMock);

    await getUsdToKrwRate();
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("falls back to the last stored rate when the provider times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));
    repo.findLatestRate.mockResolvedValue({ rate: 1375, fetchedAt: "2026-09-20T00:00:00Z" });

    await expect(getUsdToKrwRate()).resolves.toMatchObject({ rate: 1375, cached: true, fallback: true });
  });

  it("uses the hardcoded rate when nothing is stored and the provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("down", { status: 503 })));

    await expect(getUsdToKrwRate()).resolves.toMatchObject({ rate: 1370, fallback: true });
  });

  it("never throws when the rate table is unavailable", async () => {
    repo.findRecentRate.mockRejectedValue(new Error("db down"));

    await expect(getUsdToKrwRate()).resolves.toMatchObject({ rate: 1370, fallback: true });
  });

  it("still returns the live rate when storing it fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: "success", conversion_rate: 1392 })));
    repo.insertRate.mockRejectedValue(new Error("write failed"));

    await expect(getUsdToKrwRate()).resolves.toMatchObject({ rate: 1392, fallback: false });
  });
});

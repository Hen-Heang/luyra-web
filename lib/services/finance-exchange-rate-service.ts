import "server-only";
import { findLatestRate, findRecentRate, insertRate } from "@/lib/repositories/finance-exchange-rate-repository";

// Matches the rate historically migrated from Money Flow (see
// finance_recurring_transactions.exchange_rate's default in 004_finance.sql)
// — used only when no stored rate exists and no live rate can be fetched.
const FALLBACK_USD_KRW_RATE = 1370;
const CACHE_MINUTES = 60;
// Upper bound on the live provider call. The overview and transaction sheet
// both wait on this, so a hung provider must not hang the dashboard.
const LIVE_FETCH_TIMEOUT_MS = 3000;

export interface ExchangeRateResult {
  rate: number;
  fetchedAt: string;
  cached: boolean;
  fallback: boolean;
}

function hardcodedFallback(): ExchangeRateResult {
  return { rate: FALLBACK_USD_KRW_RATE, fetchedAt: new Date().toISOString(), cached: false, fallback: true };
}

// Last stored rate of any age, then the hardcoded rate. A stale real rate is
// closer to the truth than a constant, so it's preferred; it's still flagged
// `fallback` so the UI can prompt the user to confirm it.
async function staleOrHardcodedFallback(): Promise<ExchangeRateResult> {
  try {
    const latest = await findLatestRate("USD", "KRW");
    if (latest) return { rate: latest.rate, fetchedAt: latest.fetchedAt, cached: true, fallback: true };
  } catch (error) {
    console.error("[finance] stored exchange rate lookup failed, using hardcoded fallback", error);
  }
  return hardcodedFallback();
}

async function fetchLiveRate(apiKey: string): Promise<number> {
  const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/KRW`, {
    cache: "no-store",
    signal: AbortSignal.timeout(LIVE_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Exchange rate API responded with ${response.status}`);

  const data = (await response.json()) as { result?: string; conversion_rate?: number };
  if (data.result !== "success" || typeof data.conversion_rate !== "number") {
    throw new Error("Unexpected exchange rate API response shape");
  }
  return data.conversion_rate;
}

// Server-side only, cached in finance_exchange_rates so a rate is fetched at
// most once per cache window rather than on every render. EXCHANGE_RATE_API_KEY
// is optional — with no key configured this returns the last stored rate or the
// fallback, which is exactly the "allow manual rate fallback" behavior; the
// amount entry UI lets the user override whatever rate this returns before
// saving. Never throws: callers (notably the overview) must keep rendering real
// transaction data when the provider or the rate table is unavailable.
export async function getUsdToKrwRate(): Promise<ExchangeRateResult> {
  try {
    const cached = await findRecentRate("USD", "KRW", CACHE_MINUTES);
    if (cached) return { rate: cached.rate, fetchedAt: cached.fetchedAt, cached: true, fallback: false };
  } catch (error) {
    console.error("[finance] cached exchange rate lookup failed", error);
    return hardcodedFallback();
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) return staleOrHardcodedFallback();

  let rate: number;
  try {
    rate = await fetchLiveRate(apiKey);
  } catch (error) {
    // Error objects here carry only the status/shape/abort reason — never the
    // request URL, so the key stays out of the logs.
    console.error("[finance] live exchange rate fetch failed, using fallback", error);
    return staleOrHardcodedFallback();
  }

  const fetchedAt = new Date().toISOString();
  try {
    await insertRate("USD", "KRW", rate, fetchedAt);
  } catch (error) {
    // The live rate is still correct; only the cache write failed.
    console.error("[finance] failed to store fetched exchange rate", error);
  }
  return { rate, fetchedAt, cached: false, fallback: false };
}

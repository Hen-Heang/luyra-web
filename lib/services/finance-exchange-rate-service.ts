import "server-only";
import { findRecentRate, insertRate } from "@/lib/repositories/finance-exchange-rate-repository";

// Matches the rate historically migrated from Money Flow (see
// finance_recurring_transactions.exchange_rate's default in 004_finance.sql)
// — used only when no cached rate exists and no live API key is configured.
const FALLBACK_USD_KRW_RATE = 1370;
const CACHE_MINUTES = 60;

export interface ExchangeRateResult {
  rate: number;
  fetchedAt: string;
  cached: boolean;
  fallback: boolean;
}

// Server-side only, cached in finance_exchange_rates so a rate is fetched at
// most once per cache window rather than on every render. EXCHANGE_RATE_API_KEY
// is optional — with no key configured this always returns the fallback rate,
// which is exactly the "allow manual rate fallback" behavior; the amount entry
// UI lets the user override whatever rate this returns before saving.
export async function getUsdToKrwRate(): Promise<ExchangeRateResult> {
  const cached = await findRecentRate("USD", "KRW", CACHE_MINUTES);
  if (cached) return { rate: cached.rate, fetchedAt: cached.fetchedAt, cached: true, fallback: false };

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    return { rate: FALLBACK_USD_KRW_RATE, fetchedAt: new Date().toISOString(), cached: false, fallback: true };
  }

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/KRW`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Exchange rate API responded with ${response.status}`);

    const data = (await response.json()) as { result?: string; conversion_rate?: number };
    if (data.result !== "success" || typeof data.conversion_rate !== "number") {
      throw new Error("Unexpected exchange rate API response shape");
    }

    const fetchedAt = new Date().toISOString();
    await insertRate("USD", "KRW", data.conversion_rate, fetchedAt);
    return { rate: data.conversion_rate, fetchedAt, cached: false, fallback: false };
  } catch (error) {
    console.error("[finance] live exchange rate fetch failed, using fallback", error);
    return { rate: FALLBACK_USD_KRW_RATE, fetchedAt: new Date().toISOString(), cached: false, fallback: true };
  }
}

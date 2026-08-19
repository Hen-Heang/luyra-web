"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let moneyFlowClient: SupabaseClient | null | undefined;

export function createMoneyFlowClient(): SupabaseClient | null {
  if (moneyFlowClient !== undefined) return moneyFlowClient;

  const url = process.env.NEXT_PUBLIC_MONEY_FLOW_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_MONEY_FLOW_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    moneyFlowClient = null;
    return moneyFlowClient;
  }

  moneyFlowClient = createClient(url, publishableKey, {
    auth: {
      storageKey: "heangos-money-flow-auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return moneyFlowClient;
}

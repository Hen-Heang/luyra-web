import "server-only";
import { findPreferences, upsertPreferences } from "@/lib/repositories/finance-preferences-repository";
import type { UpdatePreferencesInput } from "@/lib/validation/finance";
import type { FinancePreferences } from "@/types/finance";

export async function getPreferences(userId: string): Promise<FinancePreferences> {
  return findPreferences(userId);
}

export async function editPreferences(userId: string, input: UpdatePreferencesInput): Promise<FinancePreferences> {
  return upsertPreferences(userId, input);
}

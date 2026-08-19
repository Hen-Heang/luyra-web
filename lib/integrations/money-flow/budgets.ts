import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget } from "./types";

export async function listBudgets(supabase: SupabaseClient): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("category_id, amount_krw, categories(name, icon, color)");

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Budget[];
}

export async function upsertBudget(
  supabase: SupabaseClient,
  userId: string,
  input: { category_id: string; amount_krw: number }
): Promise<void> {
  const { error } = await supabase
    .from("budgets")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id,category_id" });

  if (error) throw new Error(error.message);
}

export async function deleteBudget(supabase: SupabaseClient, categoryId: string): Promise<void> {
  const { error } = await supabase.from("budgets").delete().eq("category_id", categoryId);
  if (error) throw new Error(error.message);
}

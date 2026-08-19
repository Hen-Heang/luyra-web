import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, PaymentMethod } from "./types";

export async function listCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, color, type")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function listPaymentMethods(supabase: SupabaseClient): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, name, icon")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentMethod[];
}

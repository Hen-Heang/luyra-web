import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaction, TransactionInput, TransactionType } from "./types";

const SELECT =
  "id, date, type, category_id, description, amount_krw, payment_method_id, note, categories(name, icon, color), payment_methods(name, icon)";

export const TRANSACTIONS_PAGE_SIZE = 20;

export async function listTransactions(
  supabase: SupabaseClient,
  options: {
    start: string;
    end: string;
    type?: TransactionType;
    search?: string;
    page?: number;
  }
): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
  const page = options.page ?? 0;
  const from = page * TRANSACTIONS_PAGE_SIZE;
  const to = from + TRANSACTIONS_PAGE_SIZE - 1;

  let query = supabase
    .from("transactions")
    .select(SELECT)
    .gte("date", options.start)
    .lt("date", options.end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.type) query = query.eq("type", options.type);
  if (options.search) query = query.ilike("description", `%${options.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const transactions = (data ?? []) as unknown as Transaction[];
  return { transactions, hasMore: transactions.length === TRANSACTIONS_PAGE_SIZE };
}

export async function createTransaction(
  supabase: SupabaseClient,
  userId: string,
  input: TransactionInput
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...input, user_id: userId })
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Transaction;
}

export async function updateTransaction(
  supabase: SupabaseClient,
  id: string,
  input: TransactionInput
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .update(input)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Transaction;
}

export async function deleteTransaction(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

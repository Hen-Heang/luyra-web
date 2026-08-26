import "server-only";
import { sql } from "@/lib/db";
import type { CategoryUsage, DescriptionSuggestion, TransactionType } from "@/types/finance";

// How often each category has actually been used, split by transaction type so
// the expense picker ranks on expense history and the income picker on income
// history. Drives the "Often used" group at the top of the category picker.
export async function findCategoryUsageByUser(userId: string, since: string): Promise<CategoryUsage[]> {
  const rows = (await sql`
    select category_id, type, count(*)::int as usage_count, to_char(max(date), 'YYYY-MM-DD') as last_used_at
    from finance_transactions
    where user_id = ${userId} and date >= ${since} and category_id is not null
    group by category_id, type
    order by usage_count desc, last_used_at desc
  `) as { category_id: string; type: string; usage_count: number; last_used_at: string }[];

  return rows.map((row) => ({
    categoryId: row.category_id,
    type: row.type as TransactionType,
    count: row.usage_count,
    lastUsedAt: row.last_used_at,
  }));
}

// Descriptions the user has already entered, grouped case-insensitively so
// "Coffee" and "coffee" count as one suggestion. Each row carries the details
// from the most recent entry with that description, so picking a suggestion can
// prefill the category and payment method too.
export async function findDescriptionSuggestionsByUser(
  userId: string,
  since: string,
  limit: number
): Promise<DescriptionSuggestion[]> {
  const rows = (await sql`
    select
      (array_agg(t.description order by t.date desc, t.created_at desc))[1] as description,
      t.type,
      (array_agg(t.category_id order by t.date desc, t.created_at desc))[1] as category_id,
      (array_agg(c.name order by t.date desc, t.created_at desc))[1] as category_name,
      (array_agg(t.payment_method_id order by t.date desc, t.created_at desc))[1] as payment_method_id,
      (array_agg(t.amount_krw order by t.date desc, t.created_at desc))[1] as amount_krw,
      count(*)::int as usage_count,
      to_char(max(t.date), 'YYYY-MM-DD') as last_used_at
    from finance_transactions t
    left join finance_categories c on c.id = t.category_id
    where t.user_id = ${userId} and t.date >= ${since}
      and t.description is not null and trim(t.description) <> ''
    group by lower(trim(t.description)), t.type
    order by usage_count desc, last_used_at desc
    limit ${limit}
  `) as {
    description: string;
    type: string;
    category_id: string | null;
    category_name: string | null;
    payment_method_id: string | null;
    amount_krw: string;
    usage_count: number;
    last_used_at: string;
  }[];

  return rows.map((row) => ({
    description: row.description,
    type: row.type as TransactionType,
    categoryId: row.category_id,
    categoryName: row.category_name,
    paymentMethodId: row.payment_method_id,
    amountKrw: Number(row.amount_krw),
    count: row.usage_count,
    lastUsedAt: row.last_used_at,
  }));
}

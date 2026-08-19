import "server-only";
import { sql } from "@/lib/db";
import type { FinancePreferences } from "@/types/finance";

const DEFAULT_PREFERENCES: FinancePreferences = { monthlySpendingLimitKrw: null, targetSavingsRate: 20 };

export async function findPreferences(userId: string): Promise<FinancePreferences> {
  const rows = (await sql`
    select monthly_spending_limit_krw, target_savings_rate from finance_preferences where user_id = ${userId}
  `) as { monthly_spending_limit_krw: string | null; target_savings_rate: string }[];

  if (!rows[0]) return DEFAULT_PREFERENCES;

  return {
    monthlySpendingLimitKrw: rows[0].monthly_spending_limit_krw !== null ? Number(rows[0].monthly_spending_limit_krw) : null,
    targetSavingsRate: Number(rows[0].target_savings_rate),
  };
}

export async function upsertPreferences(
  userId: string,
  input: { monthlySpendingLimitKrw?: number | null; targetSavingsRate?: number }
): Promise<FinancePreferences> {
  const existing = (await sql`select user_id from finance_preferences where user_id = ${userId}`) as { user_id: string }[];

  if (existing.length > 0) {
    const sets: string[] = [];
    const params: unknown[] = [userId];
    const set = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };
    if (input.monthlySpendingLimitKrw !== undefined) set("monthly_spending_limit_krw", input.monthlySpendingLimitKrw);
    if (input.targetSavingsRate !== undefined) set("target_savings_rate", input.targetSavingsRate);
    sets.push("updated_at = now()");

    await sql.query(`update finance_preferences set ${sets.join(", ")} where user_id = $1`, params);
  } else {
    await sql`
      insert into finance_preferences (user_id, monthly_spending_limit_krw, target_savings_rate)
      values (${userId}, ${input.monthlySpendingLimitKrw ?? null}, ${input.targetSavingsRate ?? 20})
    `;
  }

  return findPreferences(userId);
}

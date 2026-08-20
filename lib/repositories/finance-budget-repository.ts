import "server-only";
import { sql } from "@/lib/db";
import type { Budget } from "@/types/finance";

export async function findBudgetsByUser(userId: string): Promise<Budget[]> {
  const rows = (await sql`
    select b.category_id, c.name as category_name, c.icon as category_icon,
      c.color as category_color, b.amount_krw
    from finance_budgets b
    join finance_categories c on c.id = b.category_id
    where b.user_id = ${userId}
  `) as {
    category_id: string;
    category_name: string;
    category_icon: string | null;
    category_color: string | null;
    amount_krw: string;
  }[];

  return rows.map((r) => ({
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryIcon: r.category_icon,
    categoryColor: r.category_color,
    amountKrw: Number(r.amount_krw),
  }));
}

// No unique(user_id, category_id) constraint is declared in
// db/migrations/004_finance.sql, so this checks-then-writes instead of
// relying on `on conflict` (which would error without a matching constraint).
export async function upsertBudget(userId: string, categoryId: string, amountKrw: number): Promise<void> {
  const existing = (await sql`
    select id from finance_budgets where user_id = ${userId} and category_id = ${categoryId}
  `) as { id: string }[];

  if (existing.length > 0) {
    await sql`
      update finance_budgets set amount_krw = ${amountKrw}, updated_at = now()
      where user_id = ${userId} and category_id = ${categoryId}
    `;
  } else {
    await sql`
      insert into finance_budgets (user_id, category_id, amount_krw)
      values (${userId}, ${categoryId}, ${amountKrw})
    `;
  }
}

export async function deleteBudget(userId: string, categoryId: string): Promise<void> {
  await sql`delete from finance_budgets where user_id = ${userId} and category_id = ${categoryId}`;
}

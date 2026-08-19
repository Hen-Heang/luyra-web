import "server-only";
import { sql } from "@/lib/db";
import type { Category, PaymentMethod } from "@/types/finance";

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
}

function toCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, icon: row.icon, color: row.color, type: row.type as Category["type"] };
}

export async function findCategoriesByUser(userId: string): Promise<Category[]> {
  const rows = (await sql`
    select id, name, icon, color, type from finance_categories
    where user_id = ${userId}
    order by name asc
  `) as CategoryRow[];

  return rows.map(toCategory);
}

export async function findPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
  const rows = (await sql`
    select id, name, icon from finance_payment_methods
    where user_id = ${userId}
    order by name asc
  `) as PaymentMethod[];

  return rows;
}

import "server-only";
import { sql } from "@/lib/db";
import type { CategoryAmount, Transaction, TransactionType } from "@/types/finance";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/lib/validation/finance";

interface TransactionRow {
  id: string;
  date: string;
  type: string;
  category_id: string | null;
  category_name: string | null;
  description: string;
  amount_krw: string;
  payment_method_id: string | null;
  payment_method_name: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    type: row.type as TransactionType,
    categoryId: row.category_id,
    categoryName: row.category_name,
    description: row.description,
    amountKrw: Number(row.amount_krw),
    paymentMethodId: row.payment_method_id,
    paymentMethodName: row.payment_method_name,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// date is cast to text explicitly, same reasoning as goals.target_date: the
// driver would otherwise parse it into a JS Date and re-encode it as a UTC
// instant, shifting the calendar date outside UTC.
const TRANSACTION_SELECT = `
  t.id, to_char(t.date, 'YYYY-MM-DD') as date, t.type, t.category_id,
  c.name as category_name, t.description, t.amount_krw,
  t.payment_method_id, pm.name as payment_method_name, t.note,
  t.created_at, t.updated_at
`;
const TRANSACTION_FROM = `
  from finance_transactions t
  left join finance_categories c on c.id = t.category_id
  left join finance_payment_methods pm on pm.id = t.payment_method_id
`;

const PAGE_SIZE = 20;

export interface TransactionQuery {
  start: string;
  end: string;
  type?: TransactionType;
  search?: string;
  page: number;
}

export async function findTransactionsByUser(
  userId: string,
  query: TransactionQuery
): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
  const conditions = ["t.user_id = $1", "t.date >= $2", "t.date < $3"];
  const params: unknown[] = [userId, query.start, query.end];

  if (query.type) {
    params.push(query.type);
    conditions.push(`t.type = $${params.length}`);
  }
  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(`t.description ilike $${params.length}`);
  }

  params.push(PAGE_SIZE + 1, query.page * PAGE_SIZE);

  const rows = (await sql.query(
    `select ${TRANSACTION_SELECT} ${TRANSACTION_FROM}
     where ${conditions.join(" and ")}
     order by t.date desc, t.created_at desc
     limit $${params.length - 1} offset $${params.length}`,
    params
  )) as TransactionRow[];

  const hasMore = rows.length > PAGE_SIZE;
  return { transactions: rows.slice(0, PAGE_SIZE).map(toTransaction), hasMore };
}

export async function findTransactionById(id: string, userId: string): Promise<Transaction | null> {
  const rows = (await sql`
    select ${sql.unsafe(TRANSACTION_SELECT)} ${sql.unsafe(TRANSACTION_FROM)}
    where t.id = ${id} and t.user_id = ${userId}
  `) as TransactionRow[];

  return rows[0] ? toTransaction(rows[0]) : null;
}

export async function createTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
  const rows = (await sql`
    insert into finance_transactions (user_id, date, type, category_id, description, amount_krw, payment_method_id, note)
    values (
      ${userId}, ${input.date}, ${input.type}, ${input.categoryId ?? null},
      ${input.description}, ${input.amountKrw}, ${input.paymentMethodId ?? null}, ${input.note ?? null}
    )
    returning id
  `) as { id: string }[];

  const created = await findTransactionById(rows[0].id, userId);
  if (!created) throw new Error("Failed to load the transaction just created");
  return created;
}

export async function updateTransaction(
  id: string,
  userId: string,
  input: UpdateTransactionInput
): Promise<Transaction | null> {
  const rows = (await sql`
    update finance_transactions set
      date = ${input.date},
      type = ${input.type},
      category_id = ${input.categoryId ?? null},
      description = ${input.description},
      amount_krw = ${input.amountKrw},
      payment_method_id = ${input.paymentMethodId ?? null},
      note = ${input.note ?? null},
      updated_at = now()
    where id = ${id} and user_id = ${userId}
    returning id
  `) as { id: string }[];

  if (!rows[0]) return null;
  return findTransactionById(id, userId);
}

export async function deleteTransaction(id: string, userId: string): Promise<boolean> {
  const rows = (await sql`
    delete from finance_transactions where id = ${id} and user_id = ${userId} returning id
  `) as { id: string }[];

  return rows.length > 0;
}

export async function sumTotalsForRange(
  userId: string,
  start: string,
  end: string
): Promise<{ incomeKrw: number; expenseKrw: number; count: number }> {
  const rows = (await sql`
    select
      coalesce(sum(amount_krw) filter (where type = 'income'), 0) as income_krw,
      coalesce(sum(amount_krw) filter (where type = 'expense'), 0) as expense_krw,
      count(*)::int as count
    from finance_transactions
    where user_id = ${userId} and date >= ${start} and date < ${end}
  `) as { income_krw: string; expense_krw: string; count: number }[];

  const row = rows[0];
  return { incomeKrw: Number(row.income_krw), expenseKrw: Number(row.expense_krw), count: row.count };
}

export async function sumExpenseByCategoryForRange(userId: string, start: string, end: string): Promise<CategoryAmount[]> {
  const rows = (await sql`
    select t.category_id, coalesce(c.name, 'Uncategorized') as category_name, sum(t.amount_krw)::numeric as amount_krw
    from finance_transactions t
    left join finance_categories c on c.id = t.category_id
    where t.user_id = ${userId} and t.type = 'expense' and t.date >= ${start} and t.date < ${end}
    group by t.category_id, c.name
    order by amount_krw desc
  `) as { category_id: string | null; category_name: string; amount_krw: string }[];

  return rows.map((r) => ({ categoryId: r.category_id, categoryName: r.category_name, amountKrw: Number(r.amount_krw) }));
}

export interface RecurringExpenseGroup {
  key: string;
  displayName: string;
  categoryId: string | null;
  dates: string[];
  amounts: number[];
  occurrenceCount: number;
}

// Groups expenses by normalized description — the same payment recurring
// over time (subscriptions, rent, etc). `since` bounds how far back to look
// so one-off matches from years ago don't count as "recurring".
export async function findRecurringExpenseGroups(userId: string, since: string): Promise<RecurringExpenseGroup[]> {
  const rows = (await sql`
    select
      lower(trim(description)) as key,
      (array_agg(description order by date desc))[1] as display_name,
      (array_agg(category_id order by date desc))[1] as category_id,
      array_agg(to_char(date, 'YYYY-MM-DD') order by date desc) as dates,
      array_agg(amount_krw order by date desc) as amounts,
      count(*)::int as occurrence_count
    from finance_transactions
    where user_id = ${userId} and type = 'expense' and date >= ${since}
      and description is not null and trim(description) <> ''
    group by lower(trim(description))
    having count(*) >= 2
    order by count(*) desc
  `) as {
    key: string;
    display_name: string;
    category_id: string | null;
    dates: string[];
    amounts: string[];
    occurrence_count: number;
  }[];

  return rows.map((r) => ({
    key: r.key,
    displayName: r.display_name,
    categoryId: r.category_id,
    dates: r.dates,
    amounts: r.amounts.map(Number),
    occurrenceCount: r.occurrence_count,
  }));
}

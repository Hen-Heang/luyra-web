import "server-only";
import { Errors } from "@/lib/errors";
import {
  createTransaction as createTransactionRepo,
  deleteTransaction as deleteTransactionRepo,
  findTransactionsByUser,
  updateTransaction as updateTransactionRepo,
  type ResolvedTransactionInput,
  type TransactionQuery,
} from "@/lib/repositories/finance-transaction-repository";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/lib/validation/finance";
import type { Transaction } from "@/types/finance";

// The one place amountKrw is computed for a foreign-currency entry — never
// trust a client-sent KRW figure for a USD transaction, and always round to
// the nearest whole won (KRW has no minor unit).
function resolveAmounts(input: CreateTransactionInput): { amountKrw: number; originalAmount: number | null; exchangeRate: number | null } {
  if (input.currency === "USD") {
    const originalAmount = input.originalAmount as number;
    const exchangeRate = input.exchangeRate as number;
    return { amountKrw: Math.round(originalAmount * exchangeRate), originalAmount, exchangeRate };
  }
  return { amountKrw: input.amountKrw as number, originalAmount: null, exchangeRate: null };
}

function toResolvedInput(input: CreateTransactionInput | UpdateTransactionInput): ResolvedTransactionInput {
  return { ...input, ...resolveAmounts(input) };
}

export async function listTransactions(
  userId: string,
  query: TransactionQuery
): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
  return findTransactionsByUser(userId, query);
}

export async function addTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
  return createTransactionRepo(userId, toResolvedInput(input));
}

export async function editTransaction(userId: string, id: string, input: UpdateTransactionInput): Promise<Transaction> {
  const transaction = await updateTransactionRepo(id, userId, toResolvedInput(input));
  if (!transaction) throw Errors.notFound("Transaction");
  return transaction;
}

export async function removeTransaction(userId: string, id: string): Promise<void> {
  const deleted = await deleteTransactionRepo(id, userId);
  if (!deleted) throw Errors.notFound("Transaction");
}

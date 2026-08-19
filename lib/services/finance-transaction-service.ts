import "server-only";
import { Errors } from "@/lib/errors";
import {
  createTransaction as createTransactionRepo,
  deleteTransaction as deleteTransactionRepo,
  findTransactionsByUser,
  updateTransaction as updateTransactionRepo,
  type TransactionQuery,
} from "@/lib/repositories/finance-transaction-repository";
import type { CreateTransactionInput, UpdateTransactionInput } from "@/lib/validation/finance";
import type { Transaction } from "@/types/finance";

export async function listTransactions(
  userId: string,
  query: TransactionQuery
): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
  return findTransactionsByUser(userId, query);
}

export async function addTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
  return createTransactionRepo(userId, input);
}

export async function editTransaction(userId: string, id: string, input: UpdateTransactionInput): Promise<Transaction> {
  const transaction = await updateTransactionRepo(id, userId, input);
  if (!transaction) throw Errors.notFound("Transaction");
  return transaction;
}

export async function removeTransaction(userId: string, id: string): Promise<void> {
  const deleted = await deleteTransactionRepo(id, userId);
  if (!deleted) throw Errors.notFound("Transaction");
}

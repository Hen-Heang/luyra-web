import { apiFetch } from "@/lib/api/client";
import type {
  CreateContributionInput,
  CreateSavingsGoalInput,
  CreateTransactionInput,
  SetSubscriptionStatusInput,
  UpdatePreferencesInput,
  UpdateSavingsGoalInput,
  UpdateTransactionInput,
  UpsertBudgetInput,
} from "@/lib/validation/finance";
import type {
  AnalyticsSummary,
  Budget,
  Category,
  DetectedSubscription,
  FinancePreferences,
  FinanceOverviewSummary,
  PaymentMethod,
  ReviewSummary,
  SavingsContribution,
  SavingsGoal,
  Transaction,
  TransactionType,
} from "@/types/finance";

export function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/api/finance/categories");
}

export function listPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>("/api/finance/payment-methods");
}

export function listTransactions(params: {
  start: string;
  end: string;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  page?: number;
}): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
  const query = new URLSearchParams({ start: params.start, end: params.end });
  if (params.type) query.set("type", params.type);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  return apiFetch(`/api/finance/transactions?${query.toString()}`);
}

export function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>("/api/finance/transactions", { method: "POST", body: JSON.stringify(input) });
}

export function updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>(`/api/finance/transactions/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch<{ id: string }>(`/api/finance/transactions/${id}`, { method: "DELETE" });
}

export function listBudgets(
  start: string,
  end: string
): Promise<{ categories: Category[]; budgets: Budget[]; spendByCategory: Record<string, number> }> {
  const query = new URLSearchParams({ start, end });
  return apiFetch(`/api/finance/budgets?${query.toString()}`);
}

export async function upsertBudget(input: UpsertBudgetInput): Promise<void> {
  await apiFetch<{ categoryId: string }>("/api/finance/budgets", { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteBudget(categoryId: string): Promise<void> {
  await apiFetch<{ categoryId: string }>(`/api/finance/budgets/${categoryId}`, { method: "DELETE" });
}

export function listSavingsGoals(): Promise<SavingsGoal[]> {
  return apiFetch<SavingsGoal[]>("/api/finance/savings");
}

export function createSavingsGoal(input: CreateSavingsGoalInput): Promise<SavingsGoal> {
  return apiFetch<SavingsGoal>("/api/finance/savings", { method: "POST", body: JSON.stringify(input) });
}

export function updateSavingsGoal(id: string, input: UpdateSavingsGoalInput): Promise<SavingsGoal> {
  return apiFetch<SavingsGoal>(`/api/finance/savings/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await apiFetch<{ id: string }>(`/api/finance/savings/${id}`, { method: "DELETE" });
}

export function addSavingsContribution(goalId: string, input: CreateContributionInput): Promise<SavingsContribution> {
  return apiFetch<SavingsContribution>(`/api/finance/savings/${goalId}/contributions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listDetectedSubscriptions(): Promise<DetectedSubscription[]> {
  return apiFetch<DetectedSubscription[]>("/api/finance/subscriptions");
}

export async function setSubscriptionStatus(key: string, input: SetSubscriptionStatusInput): Promise<void> {
  await apiFetch<{ key: string }>(`/api/finance/subscriptions/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function getPreferences(): Promise<FinancePreferences> {
  return apiFetch<FinancePreferences>("/api/finance/preferences");
}

export function updatePreferences(input: UpdatePreferencesInput): Promise<FinancePreferences> {
  return apiFetch<FinancePreferences>("/api/finance/preferences", { method: "PUT", body: JSON.stringify(input) });
}

export function getAnalyticsSummary(month: string): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>(`/api/finance/analytics?month=${month}`);
}

export function getFinanceOverview(month: string): Promise<FinanceOverviewSummary> {
  return apiFetch<FinanceOverviewSummary>(`/api/finance/overview?month=${month}`);
}

export function getReviewSummary(month: string): Promise<ReviewSummary> {
  return apiFetch<ReviewSummary>(`/api/finance/review?month=${month}`);
}

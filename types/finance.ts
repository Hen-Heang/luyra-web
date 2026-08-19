export type TransactionType = "income" | "expense";
export type CategoryType = "income" | "expense" | "both";
export type SubscriptionStatus = "keep" | "review" | "plan_to_cancel" | "cancelled";

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string | null;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  categoryId: string | null;
  categoryName: string | null;
  description: string;
  amountKrw: number;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  categoryId: string;
  categoryName: string;
  amountKrw: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetUsd: number;
  currentUsd: number;
  deadline: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amountUsd: number;
  contributionMonth: string;
  createdAt: string;
}

export interface DetectedSubscription {
  key: string;
  name: string;
  categoryName: string | null;
  latestAmountKrw: number;
  averageAmountKrw: number;
  occurrenceCount: number;
  lastPaymentDate: string;
  frequency: "monthly" | "yearly" | "irregular";
  estimatedYearlyCostKrw: number;
  status: SubscriptionStatus;
}

export interface FinancePreferences {
  monthlySpendingLimitKrw: number | null;
  targetSavingsRate: number;
}

export interface MonthTotals {
  totalIncomeKrw: number;
  totalExpenseKrw: number;
  netCashFlowKrw: number;
  savingsRatePct: number;
  transactionCount: number;
}

export interface CategoryAmount {
  categoryId: string | null;
  categoryName: string;
  amountKrw: number;
}

export interface CategoryComparison {
  categoryId: string | null;
  categoryName: string;
  currentKrw: number;
  previousKrw: number;
  deltaKrw: number;
}

export interface BudgetPerformance {
  categoryId: string;
  categoryName: string;
  budgetKrw: number;
  spentKrw: number;
  remainingKrw: number;
  usagePct: number;
  overBudget: boolean;
}

export interface AnalyticsSummary {
  month: string;
  totals: MonthTotals;
  categories: CategoryAmount[];
}

export interface ReviewSummary {
  month: string;
  totals: MonthTotals;
  previousTotals: MonthTotals;
  categoryComparison: CategoryComparison[];
  budgetPerformance: BudgetPerformance[];
  subscriptionsMonthlyKrw: number;
  savingsGoalsCount: number;
}

export type TransactionType = "income" | "expense";
export type CategoryType = "income" | "expense" | "both";
export type SubscriptionStatus = "keep" | "review" | "plan_to_cancel" | "cancelled";
// KRW is the canonical accounting currency everywhere in Finance — every sum,
// budget, and analytic is KRW. USD is the one supported original currency a
// transaction can be entered in; amountKrw is always populated regardless.
export type Currency = "KRW" | "USD";

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
  categoryIcon: string | null;
  categoryColor: string | null;
  description: string;
  amountKrw: number;
  currency: Currency;
  originalAmount: number | null;
  exchangeRate: number | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// The shape exported over CSV/JSON — deliberately trimmed of internal ids,
// icon/color metadata, and timestamps that don't belong in a data export.
export interface TransactionExportRow {
  date: string;
  type: TransactionType;
  description: string;
  amountKrw: number;
  currency: Currency;
  originalAmount: number | null;
  exchangeRate: number | null;
  categoryName: string | null;
  paymentMethodName: string | null;
  note: string | null;
}

export interface TransactionTemplate {
  id: string;
  type: TransactionType;
  description: string;
  amountKrw: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  note: string | null;
  createdAt: string;
}

export interface Budget {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
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
  categoryIcon: string | null;
  categoryColor: string | null;
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
  budgetWatchThresholdPct: number;
  budgetNearLimitThresholdPct: number;
  monthlyReviewEnabled: boolean;
  financeReportEmail: string | null;
  weeklyReportEmailEnabled: boolean;
  monthlyReportEmailEnabled: boolean;
}

export interface MonthTotals {
  totalIncomeKrw: number;
  totalExpenseKrw: number;
  netCashFlowKrw: number;
  savingsRatePct: number;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
}

export interface CategoryAmount {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
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
  categoryIcon: string | null;
  categoryColor: string | null;
  budgetKrw: number;
  spentKrw: number;
  remainingKrw: number;
  usagePct: number;
  overBudget: boolean;
  status: "ok" | "watch" | "near_limit" | "exceeded";
}

export interface PaymentMethodAmount {
  paymentMethodId: string | null;
  paymentMethodName: string;
  amountKrw: number;
}

export interface DailyFlowPoint {
  date: string;
  incomeKrw: number;
  expenseKrw: number;
}

export interface AnalyticsSummary {
  month: string;
  totals: MonthTotals;
  previousMonth: string;
  previousTotals: MonthTotals;
  categories: CategoryAmount[];
  paymentMethods: PaymentMethodAmount[];
  dailyTrend: DailyFlowPoint[];
}

export interface DailySpendingPoint {
  date: string;
  amountKrw: number;
}

export interface DailyBudgetGuide {
  totalBudgetKrw: number;
  spentTodayKrw: number;
  availablePerDayKrw: number;
  monthlyRemainingKrw: number;
  daysRemaining: number;
  status: "healthy" | "watch" | "over";
}

export interface SavingsRateHealth {
  targetRatePct: number;
  deltaPct: number | null;
  status: "unavailable" | "above" | "on_target" | "below";
}

export interface BudgetHealth {
  totalBudgetKrw: number;
  totalSpentKrw: number;
  remainingKrw: number;
  usagePct: number;
  status: BudgetPerformance["status"];
  attentionCount: number;
}

export interface FinanceOverviewSummary {
  month: string;
  totals: MonthTotals;
  savingsHealth: SavingsRateHealth;
  budgetHealth: BudgetHealth | null;
  categories: CategoryAmount[];
  dailySpending: DailySpendingPoint[];
  dailyBudget: DailyBudgetGuide | null;
  budgetPerformance: BudgetPerformance[];
  recentTransactions: Transaction[];
}

export interface ReviewObservation {
  id: string;
  tone: "positive" | "warning" | "neutral";
  text: string;
}

// Shared by Review and by the Weekly/Monthly reports — one savings-progress
// shape computed once in finance-savings-service.ts's computeSavingsProgress.
export interface SavingsProgress {
  totalSavedUsd: number;
  totalTargetUsd: number;
  overallPct: number;
  goalsCount: number;
  goalsReachedCount: number;
}

export interface ReviewSummary {
  month: string;
  totals: MonthTotals;
  previousTotals: MonthTotals;
  categoryComparison: CategoryComparison[];
  budgetPerformance: BudgetPerformance[];
  subscriptionsMonthlyKrw: number;
  savingsProgress: SavingsProgress;
  observations: ReviewObservation[];
}

export interface ReportCategoryAmount {
  categoryId: string | null;
  categoryName: string;
  amountKrw: number;
  pctOfTotal: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  incomeKrw: number;
  expenseKrw: number;
  netCashFlowKrw: number;
  previousWeekExpenseKrw: number;
  expenseChangePct: number | null;
  topCategories: ReportCategoryAmount[];
  budgetWarnings: BudgetPerformance[];
  savingsProgress: SavingsProgress;
  subscriptionsMonthlyKrw: number;
}

export interface MonthlyReport {
  month: string;
  totals: MonthTotals;
  previousTotals: MonthTotals;
  topCategories: ReportCategoryAmount[];
  categoryComparison: CategoryComparison[];
  budgetPerformance: BudgetPerformance[];
  subscriptionsMonthlyKrw: number;
  savingsProgress: SavingsProgress;
  observations: ReviewObservation[];
}

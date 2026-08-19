import "server-only";
import {
  deleteBudget as deleteBudgetRepo,
  findBudgetsByUser,
  upsertBudget as upsertBudgetRepo,
} from "@/lib/repositories/finance-budget-repository";
import { findCategoriesByUser } from "@/lib/repositories/finance-lookup-repository";
import { sumExpenseByCategoryForRange } from "@/lib/repositories/finance-transaction-repository";
import type { Budget, BudgetPerformance, Category } from "@/types/finance";

export async function listBudgetsForMonth(
  userId: string,
  start: string,
  end: string
): Promise<{ categories: Category[]; budgets: Budget[]; spendByCategory: Record<string, number> }> {
  const [categories, budgets, spend] = await Promise.all([
    findCategoriesByUser(userId),
    findBudgetsByUser(userId),
    sumExpenseByCategoryForRange(userId, start, end),
  ]);

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
  const spendByCategory: Record<string, number> = {};
  for (const entry of spend) {
    if (entry.categoryId) spendByCategory[entry.categoryId] = entry.amountKrw;
  }

  return { categories: expenseCategories, budgets, spendByCategory };
}

export async function upsertBudget(userId: string, categoryId: string, amountKrw: number): Promise<void> {
  await upsertBudgetRepo(userId, categoryId, amountKrw);
}

export async function deleteBudget(userId: string, categoryId: string): Promise<void> {
  await deleteBudgetRepo(userId, categoryId);
}

export async function computeBudgetPerformance(userId: string, start: string, end: string): Promise<BudgetPerformance[]> {
  const [budgets, spend] = await Promise.all([findBudgetsByUser(userId), sumExpenseByCategoryForRange(userId, start, end)]);
  const spendByCategory = new Map(spend.map((s) => [s.categoryId, s.amountKrw]));

  return budgets
    .filter((b) => b.amountKrw > 0)
    .map((b) => {
      const spentKrw = spendByCategory.get(b.categoryId) ?? 0;
      const usagePct = b.amountKrw > 0 ? Math.round((spentKrw / b.amountKrw) * 100) : 0;
      return {
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        budgetKrw: b.amountKrw,
        spentKrw,
        remainingKrw: b.amountKrw - spentKrw,
        usagePct,
        overBudget: spentKrw > b.amountKrw,
      };
    })
    .sort((a, b) => b.usagePct - a.usagePct);
}

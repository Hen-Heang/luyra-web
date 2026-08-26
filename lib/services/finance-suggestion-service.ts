import "server-only";
import {
  findCategoryUsageByUser,
  findDescriptionSuggestionsByUser,
} from "@/lib/repositories/finance-suggestion-repository";
import type { TransactionSuggestions } from "@/types/finance";

// Six months is long enough that a monthly bill still ranks, short enough that
// habits the user has dropped stop crowding the top of the picker.
const LOOKBACK_MONTHS = 6;
const DESCRIPTION_LIMIT = 200;

export async function getTransactionSuggestions(userId: string): Promise<TransactionSuggestions> {
  const since = new Date();
  since.setMonth(since.getMonth() - LOOKBACK_MONTHS);
  const sinceStr = since.toISOString().slice(0, 10);

  const [categoryUsage, descriptions] = await Promise.all([
    findCategoryUsageByUser(userId, sinceStr),
    findDescriptionSuggestionsByUser(userId, sinceStr, DESCRIPTION_LIMIT),
  ]);

  return { categoryUsage, descriptions };
}

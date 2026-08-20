import { z } from "zod";

export const transactionTypeSchema = z.enum(["income", "expense"]);
export const subscriptionStatusSchema = z.enum(["keep", "review", "plan_to_cancel", "cancelled"]);

export const createTransactionSchema = z.object({
  date: z.string().date(),
  type: transactionTypeSchema,
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, "Description is required").max(200),
  amountKrw: z.number().positive(),
  paymentMethodId: z.string().uuid().nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const transactionFiltersSchema = z.object({
  start: z.string().date(),
  end: z.string().date(),
  type: transactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(0).default(0),
});
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const upsertBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amountKrw: z.number().min(0),
});
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;

export const createSavingsGoalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  icon: z.string().trim().min(1).max(8).default("💰"),
  color: z.string().trim().min(1).max(16).default("#3b82f6"),
  targetUsd: z.number().min(0),
  currentUsd: z.number().min(0).default(0),
  deadline: z.string().date().nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;

export const updateSavingsGoalSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80).optional(),
    icon: z.string().trim().min(1).max(8).optional(),
    color: z.string().trim().min(1).max(16).optional(),
    targetUsd: z.number().min(0).optional(),
    deadline: z.string().date().nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;

export const createContributionSchema = z.object({
  amountUsd: z.number().positive(),
});
export type CreateContributionInput = z.infer<typeof createContributionSchema>;

export const setSubscriptionStatusSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  status: subscriptionStatusSchema,
});
export type SetSubscriptionStatusInput = z.infer<typeof setSubscriptionStatusSchema>;

export const updatePreferencesSchema = z
  .object({
    monthlySpendingLimitKrw: z.number().min(0).nullable().optional(),
    targetSavingsRate: z.number().min(0).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const monthQuerySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");

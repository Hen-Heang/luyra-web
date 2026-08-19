import "server-only";
import { findCategoriesByUser, findPaymentMethodsByUser } from "@/lib/repositories/finance-lookup-repository";
import type { Category, PaymentMethod } from "@/types/finance";

export async function listCategories(userId: string): Promise<Category[]> {
  return findCategoriesByUser(userId);
}

export async function listPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  return findPaymentMethodsByUser(userId);
}

import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { addTransaction, listTransactions } from "@/lib/services/finance-transaction-service";
import { createTransactionSchema, transactionFiltersSchema } from "@/lib/validation/finance";

export async function GET(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const { searchParams } = request.nextUrl;

    const filters = transactionFiltersSchema.parse({
      start: searchParams.get("start"),
      end: searchParams.get("end"),
      type: searchParams.get("type") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });

    const result = await listTransactions(appUser.id, filters);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = createTransactionSchema.parse(await request.json());

    const transaction = await addTransaction(appUser.id, body);
    return apiSuccess(transaction, 201);
  } catch (error) {
    return apiError(error);
  }
}

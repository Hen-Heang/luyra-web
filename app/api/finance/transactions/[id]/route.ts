import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { editTransaction, removeTransaction } from "@/lib/services/finance-transaction-service";
import { updateTransactionSchema } from "@/lib/validation/finance";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;
    const body = updateTransactionSchema.parse(await request.json());

    const transaction = await editTransaction(appUser.id, id, body);
    return apiSuccess(transaction);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;

    await removeTransaction(appUser.id, id);
    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}

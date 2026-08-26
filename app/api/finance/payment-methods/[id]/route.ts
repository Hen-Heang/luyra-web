import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { editPaymentMethod, removePaymentMethod } from "@/lib/services/finance-lookup-service";
import { updatePaymentMethodSchema } from "@/lib/validation/finance";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;
    const body = updatePaymentMethodSchema.parse(await request.json());

    const paymentMethod = await editPaymentMethod(appUser.id, id, body);
    return apiSuccess(paymentMethod);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;

    await removePaymentMethod(appUser.id, id);
    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}

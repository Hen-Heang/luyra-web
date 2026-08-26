import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { addPaymentMethod, listPaymentMethods } from "@/lib/services/finance-lookup-service";
import { createPaymentMethodSchema } from "@/lib/validation/finance";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const paymentMethods = await listPaymentMethods(appUser.id);
    return apiSuccess(paymentMethods);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = createPaymentMethodSchema.parse(await request.json());

    const paymentMethod = await addPaymentMethod(appUser.id, body);
    return apiSuccess(paymentMethod, 201);
  } catch (error) {
    return apiError(error);
  }
}

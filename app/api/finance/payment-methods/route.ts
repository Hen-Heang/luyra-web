import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { listPaymentMethods } from "@/lib/services/finance-lookup-service";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const paymentMethods = await listPaymentMethods(appUser.id);
    return apiSuccess(paymentMethods);
  } catch (error) {
    return apiError(error);
  }
}

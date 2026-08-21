import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { getUsdToKrwRate } from "@/lib/services/finance-exchange-rate-service";

export async function GET() {
  try {
    await ensureAppUser();
    const result = await getUsdToKrwRate();
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { listDetectedSubscriptions } from "@/lib/services/finance-subscription-service";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const subscriptions = await listDetectedSubscriptions(appUser.id);
    return apiSuccess(subscriptions);
  } catch (error) {
    return apiError(error);
  }
}

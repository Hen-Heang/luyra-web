import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { getWeeklySummary } from "@/lib/services/finance-report-service";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const summary = await getWeeklySummary(appUser.id);
    return apiSuccess(summary);
  } catch (error) {
    return apiError(error);
  }
}

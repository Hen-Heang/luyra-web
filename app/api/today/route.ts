import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { getTodaySummary } from "@/lib/services/today-service";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const summary = await getTodaySummary(appUser.id);
    return apiSuccess(summary);
  } catch (error) {
    return apiError(error);
  }
}

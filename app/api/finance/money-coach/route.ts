import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { getMoneyCoachInsight } from "@/lib/services/finance-money-coach-service";
import { monthQuerySchema } from "@/lib/validation/finance";

export async function GET(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const month = monthQuerySchema.parse(request.nextUrl.searchParams.get("month"));

    const result = await getMoneyCoachInsight(appUser.id, month);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

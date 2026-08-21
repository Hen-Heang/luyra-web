import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { getMonthlyReport } from "@/lib/services/finance-report-service";
import { monthQuerySchema } from "@/lib/validation/finance";

export async function GET(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const month = monthQuerySchema.parse(request.nextUrl.searchParams.get("month"));

    const report = await getMonthlyReport(appUser.id, month);
    return apiSuccess(report);
  } catch (error) {
    return apiError(error);
  }
}

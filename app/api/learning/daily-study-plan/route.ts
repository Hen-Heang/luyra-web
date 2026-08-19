import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { applyActivityAction, getOrCreateTodayPlan, updatePlanText } from "@/lib/services/daily-study-plan-service";
import { dailyStudyPlanPatchSchema, dailyStudyModeSchema } from "@/lib/validation/learning";

export async function GET(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const modeParam = request.nextUrl.searchParams.get("mode");
    const mode = dailyStudyModeSchema.parse(modeParam ?? "normal");

    const plan = await getOrCreateTodayPlan(appUser.id, mode);
    return apiSuccess(plan);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const { planId, activityAction, reflection, missionResult } = dailyStudyPlanPatchSchema.parse(await request.json());

    let plan = null;
    if (activityAction) {
      plan = await applyActivityAction(appUser.id, planId, activityAction);
    }
    if (reflection !== undefined || missionResult !== undefined) {
      plan = await updatePlanText(appUser.id, planId, { reflection, missionResult });
    }

    return apiSuccess(plan);
  } catch (error) {
    return apiError(error);
  }
}

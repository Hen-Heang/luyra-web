import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { addGoal, listGoals } from "@/lib/services/goal-service";
import { createGoalSchema, goalFiltersSchema } from "@/lib/validation/goal";

export async function GET(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const { searchParams } = request.nextUrl;

    const filters = goalFiltersSchema.parse({
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });

    const goals = await listGoals(appUser.id, filters);
    return apiSuccess(goals);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = createGoalSchema.parse(await request.json());

    const goal = await addGoal(appUser.id, body);
    return apiSuccess(goal, 201);
  } catch (error) {
    return apiError(error);
  }
}

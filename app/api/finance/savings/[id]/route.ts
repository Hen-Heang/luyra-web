import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { editSavingsGoal, removeSavingsGoal } from "@/lib/services/finance-savings-service";
import { updateSavingsGoalSchema } from "@/lib/validation/finance";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;
    const body = updateSavingsGoalSchema.parse(await request.json());

    const goal = await editSavingsGoal(appUser.id, id, body);
    return apiSuccess(goal);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;

    await removeSavingsGoal(appUser.id, id);
    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}

import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { editHabit, getHabit, removeHabit } from "@/lib/services/habit-service";
import { updateHabitSchema } from "@/lib/validation/habit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;

    const habit = await getHabit(appUser.id, id);
    return apiSuccess(habit);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;
    const body = updateHabitSchema.parse(await request.json());

    const habit = await editHabit(appUser.id, id, body);
    return apiSuccess(habit);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;

    await removeHabit(appUser.id, id);
    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}

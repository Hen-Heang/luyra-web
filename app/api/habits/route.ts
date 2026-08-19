import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { addHabit, listHabits } from "@/lib/services/habit-service";
import { createHabitSchema } from "@/lib/validation/habit";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const habits = await listHabits(appUser.id);
    return apiSuccess(habits);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = createHabitSchema.parse(await request.json());

    const habit = await addHabit(appUser.id, body);
    return apiSuccess(habit, 201);
  } catch (error) {
    return apiError(error);
  }
}

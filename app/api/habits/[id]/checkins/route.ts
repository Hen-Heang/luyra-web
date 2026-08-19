import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { getHabitCheckins } from "@/lib/services/habit-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;

    const checkins = await getHabitCheckins(appUser.id, id);
    return apiSuccess(checkins);
  } catch (error) {
    return apiError(error);
  }
}

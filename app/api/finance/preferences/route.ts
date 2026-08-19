import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { editPreferences, getPreferences } from "@/lib/services/finance-preferences-service";
import { updatePreferencesSchema } from "@/lib/validation/finance";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const preferences = await getPreferences(appUser.id);
    return apiSuccess(preferences);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = updatePreferencesSchema.parse(await request.json());

    const preferences = await editPreferences(appUser.id, body);
    return apiSuccess(preferences);
  } catch (error) {
    return apiError(error);
  }
}

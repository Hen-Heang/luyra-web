import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { setSubscriptionStatus } from "@/lib/services/finance-subscription-service";
import { setSubscriptionStatusSchema } from "@/lib/validation/finance";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { key } = await params;
    const body = setSubscriptionStatusSchema.parse(await request.json());

    await setSubscriptionStatus(appUser.id, key, body);
    return apiSuccess({ key });
  } catch (error) {
    return apiError(error);
  }
}

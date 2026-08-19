import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { listCategories } from "@/lib/services/finance-lookup-service";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const categories = await listCategories(appUser.id);
    return apiSuccess(categories);
  } catch (error) {
    return apiError(error);
  }
}

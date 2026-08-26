import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { getTransactionSuggestions } from "@/lib/services/finance-suggestion-service";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const suggestions = await getTransactionSuggestions(appUser.id);
    return apiSuccess(suggestions);
  } catch (error) {
    return apiError(error);
  }
}

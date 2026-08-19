import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { listDueVocabCards } from "@/lib/services/vocab-service";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const result = await listDueVocabCards(appUser.id);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

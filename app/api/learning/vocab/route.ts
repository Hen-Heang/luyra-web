import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { addVocabCard, listVocabCards } from "@/lib/services/vocab-service";
import { createVocabCardSchema } from "@/lib/validation/learning";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const cards = await listVocabCards(appUser.id);
    return apiSuccess(cards);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = createVocabCardSchema.parse(await request.json());

    const card = await addVocabCard(appUser.id, body);
    return apiSuccess(card, 201);
  } catch (error) {
    return apiError(error);
  }
}

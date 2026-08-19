import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { editVocabCard, removeVocabCard } from "@/lib/services/vocab-service";
import { updateVocabCardSchema } from "@/lib/validation/learning";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;
    const body = updateVocabCardSchema.parse(await request.json());

    const card = await editVocabCard(appUser.id, id, body);
    return apiSuccess(card);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { id } = await params;

    await removeVocabCard(appUser.id, id);
    return apiSuccess({ id });
  } catch (error) {
    return apiError(error);
  }
}

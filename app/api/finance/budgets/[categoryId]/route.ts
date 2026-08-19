import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { deleteBudget } from "@/lib/services/finance-budget-service";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const appUser = await ensureAppUser();
    const { categoryId } = await params;

    await deleteBudget(appUser.id, categoryId);
    return apiSuccess({ categoryId });
  } catch (error) {
    return apiError(error);
  }
}

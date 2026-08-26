import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { addCategory, listCategories } from "@/lib/services/finance-lookup-service";
import { createCategorySchema } from "@/lib/validation/finance";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const categories = await listCategories(appUser.id);
    return apiSuccess(categories);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = createCategorySchema.parse(await request.json());

    const category = await addCategory(appUser.id, body);
    return apiSuccess(category, 201);
  } catch (error) {
    return apiError(error);
  }
}

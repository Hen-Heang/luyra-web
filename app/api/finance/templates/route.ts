import { type NextRequest } from "next/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { apiError, apiSuccess } from "@/lib/http";
import { addTemplate, listTemplates } from "@/lib/services/finance-transaction-template-service";
import { createTransactionTemplateSchema } from "@/lib/validation/finance";

export async function GET() {
  try {
    const appUser = await ensureAppUser();
    const templates = await listTemplates(appUser.id);
    return apiSuccess(templates);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await ensureAppUser();
    const body = createTransactionTemplateSchema.parse(await request.json());

    const template = await addTemplate(appUser.id, body);
    return apiSuccess(template, 201);
  } catch (error) {
    return apiError(error);
  }
}

import "server-only";
import type { User } from "@supabase/supabase-js";
import { getCurrentSupabaseUser } from "@/lib/auth/current-user";
import { Errors } from "@/lib/errors";
import { createUser, findUserById } from "@/lib/repositories/user-repository";
import type { AppUser } from "@/types/user";

function metadataString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value : null;
}

// Mirrors the authenticated Supabase user into Neon's `users` table, using
// the Supabase JWT's `sub` claim (user.id) as the shared primary key. Safe to
// call on every request that needs app data — it's a no-op after the first.
export async function ensureAppUser(): Promise<AppUser> {
  const supabaseUser = await getCurrentSupabaseUser();

  if (!supabaseUser) {
    throw Errors.unauthorized();
  }

  const existing = await findUserById(supabaseUser.id);
  if (existing) {
    return existing;
  }

  return createUser({
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    displayName: metadataString(supabaseUser, "display_name") ?? metadataString(supabaseUser, "full_name"),
    avatarUrl: metadataString(supabaseUser, "avatar_url"),
  });
}

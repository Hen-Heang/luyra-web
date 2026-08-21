import { SetPasswordForm } from "@/components/account/set-password-form";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";

export default async function AccountSecurityPage() {
  const user = await ensureAppUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account</p>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage sign-in methods for your Money Flow account.
        </p>
      </div>

      <SetPasswordForm email={user.email} />
    </div>
  );
}

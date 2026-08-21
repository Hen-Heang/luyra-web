import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            We will email a secure link to your existing Money Flow account.
          </p>
        </div>

        <ForgotPasswordForm />

        <Link
          href="/login"
          className="block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}

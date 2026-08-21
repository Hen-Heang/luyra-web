"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CircleAlert, LogOut } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMoneyFlowClient } from "@/lib/integrations/money-flow/client";

type ConnectionState = "loading" | "signed-out" | "signed-in";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.86c2.26-2.08 3.59-5.15 3.59-8.66Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3.01c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.24 21.3 7.29 24 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.27a11.98 11.98 0 0 0 0 10.76l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.43-3.43C17.94 1.17 15.24 0 12 0 7.29 0 3.24 2.7 1.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

export function MoneyFlowGate({
  children,
}: {
  children: (session: { client: SupabaseClient; userId: string }) => ReactNode;
}) {
  const [client] = useState<SupabaseClient | null>(() => createMoneyFlowClient());
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    if (!client) {
      setConnection("signed-out");
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();

    if (sessionError) {
      setError(`Money Flow session is unavailable: ${sessionError.message}`);
      setConnection("signed-out");
      return;
    }

    if (!session) {
      setConnection("signed-out");
      return;
    }

    setUserId(session.user.id);
    setConnection("signed-in");
  }, [client]);

  useEffect(() => {
    void (async () => {
      await checkSession();
    })();
  }, [checkSession]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;

    setPending(true);
    setError(null);
    const { error: authError } = await client.auth.signInWithPassword({ email, password });
    setPending(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setPassword("");
    await checkSession();
  }

  async function signInWithGoogle() {
    if (!client) return;

    setPending(true);
    setError(null);
    const returnTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: returnTo },
    });

    if (authError) {
      setPending(false);
      setError(authError.message);
    }
  }

  async function disconnect() {
    if (!client) return;

    setPending(true);
    const { error: authError } = await client.auth.signOut({ scope: "local" });
    setPending(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setUserId(null);
    setConnection("signed-out");
    setError(null);
  }

  if (!client) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CircleAlert className="size-4 text-amber-600" />
            <CardTitle>Money Flow is not configured</CardTitle>
          </div>
          <CardDescription>
            Add the Money Flow Supabase URL and publishable key to the local environment to enable
            this integration. No data will be copied.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (connection === "loading") {
    return <p className="text-sm text-muted-foreground">Connecting to Money Flow…</p>;
  }

  if (connection === "signed-out") {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Connect your Money Flow account</CardTitle>
          <CardDescription>
            Link your existing Money Flow data account once. Google normally reuses the account
            already active in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={signInWithGoogle}
            disabled={pending}
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or use Money Flow email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={signIn}>
            <div className="space-y-2">
              <Label htmlFor="money-flow-email">Money Flow email</Label>
              <Input
                id="money-flow-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="money-flow-password">Money Flow password</Label>
              <Input
                id="money-flow-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Connecting…" : "Connect Money Flow"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="success">Money Flow connected</Badge>
        <Button variant="outline" size="sm" onClick={disconnect} disabled={pending}>
          <LogOut />
          Disconnect
        </Button>
      </div>

      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {userId && children({ client, userId })}
    </div>
  );
}

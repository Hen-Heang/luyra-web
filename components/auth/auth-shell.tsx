import Image from "next/image";
import type { ReactNode } from "react";
import { BarChart3, PiggyBank, ReceiptText } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: ReceiptText,
    title: "Track clearly",
    description: "See income and spending without the spreadsheet noise.",
  },
  {
    icon: PiggyBank,
    title: "Plan with intent",
    description: "Keep budgets and savings goals in one calm workspace.",
  },
  {
    icon: BarChart3,
    title: "Review progress",
    description: "Turn everyday transactions into useful monthly context.",
  },
] as const;

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute -left-28 top-12 size-80 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
        <section className="hidden border-r border-border/70 px-10 py-9 lg:flex lg:flex-col xl:px-16 xl:py-12">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={38}
              height={38}
              className="size-9 rounded-xl shadow-sm"
              priority
            />
            <span className="text-base font-semibold tracking-tight">Luyra</span>
          </div>

          <div className="my-auto max-w-xl py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-success">
              Personal finance, simplified
            </p>
            <h1 className="mt-5 max-w-lg text-4xl font-semibold tracking-[-0.035em] text-foreground xl:text-5xl">
              Know where your money goes.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Luyra brings cash flow, budgets, savings, and reviews together so your money stays easy to understand.
            </p>

            <div className="mt-10 grid gap-3">
              {HIGHLIGHTS.map(({ icon: Icon, title: highlightTitle, description: highlightDescription }) => (
                <div
                  key={highlightTitle}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{highlightTitle}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{highlightDescription}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Track · Budget · Save · Review</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-xl shadow-sm"
                priority
              />
              <span className="text-base font-semibold tracking-tight">Luyra</span>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-card/85 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl sm:p-8 dark:shadow-black/20">
              <div className="mb-7 space-y-2">
                <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
              {children}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Your finance workspace, in one place.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRightLeft, Check, Loader2, RefreshCw, Save, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CategoryIcon } from "@/components/finance/ui/finance-primitives";
import { DescriptionSuggestInput } from "@/components/finance/transactions/description-suggest-input";
import { TemplateStrip } from "@/components/finance/transactions/template-strip";
import { getExchangeRate } from "@/lib/api/finance";
import { krw, usd } from "@/lib/finance-format";
import { cn } from "@/lib/utils";
import type { CreateTransactionInput, CreateTransactionTemplateInput } from "@/lib/validation/finance";
import type {
  Category,
  Currency,
  DescriptionSuggestion,
  PaymentMethod,
  Transaction,
  TransactionSuggestions,
  TransactionTemplate,
  TransactionType,
} from "@/types/finance";

// Two rows of the two-column picker: enough for the handful of categories a
// day-to-day entry actually lands in, without pushing the rest off screen.
const FREQUENT_CATEGORY_LIMIT = 6;

function localToday(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
}

export function TransactionSheet({
  mode,
  transaction,
  categories,
  paymentMethods,
  templates,
  suggestions,
  open,
  onOpenChange,
  onSave,
  onSaveTemplate,
  onDeleteTemplate,
}: {
  mode: "create" | "edit";
  transaction?: Transaction;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  templates: TransactionTemplate[];
  suggestions: TransactionSuggestions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CreateTransactionInput) => Promise<void>;
  onSaveTemplate: (input: CreateTransactionTemplateInput) => Promise<void>;
  onDeleteTemplate: (template: TransactionTemplate) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex max-h-[90vh] w-full gap-0 sm:max-w-lg sm:rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "New transaction" : "Edit transaction"}</SheetTitle>
          <SheetDescription>
            {mode === "create" ? "Record income or an expense." : "Update the details for this transaction."}
          </SheetDescription>
        </SheetHeader>
        {open && (
          <TransactionSheetFields
            key={`${mode}-${transaction?.id ?? "create"}`}
            mode={mode}
            transaction={transaction}
            categories={categories}
            paymentMethods={paymentMethods}
            templates={templates}
            suggestions={suggestions}
            onSave={onSave}
            onSaveTemplate={onSaveTemplate}
            onDeleteTemplate={onDeleteTemplate}
            onOpenChange={onOpenChange}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TransactionSheetFields({
  mode,
  transaction,
  categories,
  paymentMethods,
  templates,
  suggestions,
  onSave,
  onSaveTemplate,
  onDeleteTemplate,
  onOpenChange,
}: {
  mode: "create" | "edit";
  transaction?: Transaction;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  templates: TransactionTemplate[];
  suggestions: TransactionSuggestions | null;
  onSave: (input: CreateTransactionInput) => Promise<void>;
  onSaveTemplate: (input: CreateTransactionTemplateInput) => Promise<void>;
  onDeleteTemplate: (template: TransactionTemplate) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [currency, setCurrency] = useState<Currency>(transaction?.currency ?? "KRW");
  const [amount, setAmount] = useState(
    transaction ? String(transaction.currency === "USD" ? transaction.originalAmount : transaction.amountKrw) : ""
  );
  const [exchangeRate, setExchangeRate] = useState(transaction?.exchangeRate != null ? String(transaction.exchangeRate) : "");
  const hasStoredRate = transaction?.currency === "USD" && transaction.exchangeRate != null;
  const [rateFetch, setRateFetch] = useState<{ state: "idle" | "loading" | "error"; fallback: boolean }>({
    state: hasStoredRate ? "idle" : "loading",
    fallback: false,
  });
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(transaction?.date ?? localToday());
  const [paymentMethodId, setPaymentMethodId] = useState(transaction?.paymentMethodId ?? "");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  const parsedAmount = Number(amount);
  const parsedExchangeRate = Number(exchangeRate);
  const hasValidAmount = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const hasValidRate = exchangeRate.trim() !== "" && Number.isFinite(parsedExchangeRate) && parsedExchangeRate > 0;
  const previewKrw = currency === "USD" && hasValidAmount && hasValidRate ? Math.round(parsedAmount * parsedExchangeRate) : null;
  const previewUsd = currency === "KRW" && hasValidAmount && hasValidRate ? parsedAmount / parsedExchangeRate : null;

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === type || category.type === "both"),
    [categories, type]
  );

  // The picker leads with the categories this user actually reaches for,
  // ranked by how often they were used for this type of transaction over the
  // recent history the suggestions endpoint looks at.
  const usageByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const usage of suggestions?.categoryUsage ?? []) {
      if (usage.type === type) counts.set(usage.categoryId, usage.count);
    }
    return counts;
  }, [suggestions, type]);

  const frequentCategories = useMemo(
    () =>
      availableCategories
        .filter((category) => (usageByCategory.get(category.id) ?? 0) > 0)
        .sort(
          (a, b) => (usageByCategory.get(b.id) ?? 0) - (usageByCategory.get(a.id) ?? 0) || a.name.localeCompare(b.name)
        )
        .slice(0, FREQUENT_CATEGORY_LIMIT),
    [availableCategories, usageByCategory]
  );

  const descriptionSuggestions = useMemo(
    () => (suggestions?.descriptions ?? []).filter((suggestion) => suggestion.type === type),
    [suggestions, type]
  );

  useEffect(() => {
    if (hasStoredRate) return;

    let active = true;
    void getExchangeRate()
      .then((result) => {
        if (!active) return;
        setExchangeRate(String(result.rate));
        setRateFetch({ state: "idle", fallback: result.fallback });
      })
      .catch(() => {
        if (!active) return;
        setRateFetch({ state: "error", fallback: false });
      });

    return () => {
      active = false;
    };
  }, [hasStoredRate]);

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setCategoryId((current) =>
      categories.some((category) => category.id === current && (category.type === nextType || category.type === "both"))
        ? current
        : ""
    );
  }

  // Reusing a past description fills in the blanks it can. It never
  // overwrites a category or payment method the user already picked.
  function applyDescriptionSuggestion(suggestion: DescriptionSuggestion) {
    setDescription(suggestion.description);
    if (
      categoryId === "" &&
      suggestion.categoryId &&
      availableCategories.some((category) => category.id === suggestion.categoryId)
    ) {
      setCategoryId(suggestion.categoryId);
    }
    if (
      paymentMethodId === "" &&
      suggestion.paymentMethodId &&
      paymentMethods.some((method) => method.id === suggestion.paymentMethodId)
    ) {
      setPaymentMethodId(suggestion.paymentMethodId);
    }
  }

  function applyTemplate(template: TransactionTemplate) {
    setType(template.type);
    setCurrency("KRW");
    setAmount(String(template.amountKrw));
    setCategoryId(template.categoryId ?? "");
    setDescription(template.description);
    setPaymentMethodId(template.paymentMethodId ?? "");
    setNote(template.note ?? "");
    setTemplateMessage(null);
  }

  async function fetchLiveRate() {
    setRateFetch({ state: "loading", fallback: false });
    try {
      const result = await getExchangeRate();
      setExchangeRate(String(result.rate));
      setRateFetch({ state: "idle", fallback: result.fallback });
    } catch {
      setRateFetch({ state: "error", fallback: false });
    }
  }

  function handleCurrencyChange(next: Currency) {
    setCurrency(next);
    if (next === "USD" && exchangeRate.trim() === "" && rateFetch.state !== "loading") {
      void fetchLiveRate();
    }
  }

  async function handleSaveAsTemplate() {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setTemplateMessage("Enter an amount first.");
      return;
    }
    const parsedRate = currency === "USD" ? Number(exchangeRate) : null;
    if (currency === "USD" && (!Number.isFinite(parsedRate) || (parsedRate as number) <= 0)) {
      setTemplateMessage("Enter a valid exchange rate first.");
      return;
    }
    if (description.trim().length === 0) {
      setTemplateMessage("Enter a description first.");
      return;
    }

    setSavingTemplate(true);
    setTemplateMessage(null);
    try {
      await onSaveTemplate({
        type,
        description: description.trim(),
        amountKrw: currency === "USD" ? Math.round(parsedAmount * (parsedRate as number)) : parsedAmount,
        categoryId: categoryId || null,
        paymentMethodId: paymentMethodId || null,
        note: note.trim() || null,
      });
      setTemplateMessage(currency === "USD" ? "Template saved (converted to KRW)." : "Template saved.");
    } catch (err) {
      setTemplateMessage(err instanceof Error ? err.message : "Couldn't save the template.");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    const parsedRate = currency === "USD" ? Number(exchangeRate) : null;
    if (currency === "USD" && (!Number.isFinite(parsedRate) || (parsedRate as number) <= 0)) {
      setError("Enter a valid exchange rate.");
      return;
    }
    if (description.trim().length === 0) {
      setError("Description is required.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onSave({
        date,
        type,
        currency,
        amountKrw: currency === "KRW" ? parsedAmount : undefined,
        originalAmount: currency === "USD" ? parsedAmount : undefined,
        exchangeRate: currency === "USD" ? (parsedRate as number) : undefined,
        description: description.trim(),
        categoryId: categoryId || null,
        paymentMethodId: paymentMethodId || null,
        note: note.trim() || null,
      });
      onOpenChange(false);
    } catch {
      setError("Couldn't save the transaction. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        {mode === "create" && <TemplateStrip templates={templates} onApply={applyTemplate} onDelete={onDeleteTemplate} />}

        <div className="grid grid-cols-2 gap-1 rounded-xl border bg-secondary p-1">
          {(["expense", "income"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleTypeChange(option)}
              className={cn(
                "min-h-11 rounded-lg text-sm font-semibold capitalize transition-colors active:scale-[0.98]",
                type === option
                  ? option === "expense"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "bg-success text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="transaction-amount">Amount</Label>
            <div className="flex gap-1 rounded-lg border bg-secondary p-0.5">
              {(["KRW", "USD"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleCurrencyChange(option)}
                  aria-pressed={currency === option}
                  className={cn(
                    "min-h-7 rounded-md px-2.5 text-xs font-semibold transition-colors",
                    currency === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
            <span className="text-2xl font-semibold text-muted-foreground">{currency === "USD" ? "$" : "₩"}</span>
            <input
              id="transaction-amount"
              type="number"
              inputMode={currency === "USD" ? "decimal" : "numeric"}
              min="0"
              step={currency === "USD" ? "0.01" : "1"}
              autoFocus
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              className="w-full min-w-0 bg-transparent text-3xl font-bold tracking-tight tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div className="rounded-xl border bg-secondary/40 p-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-xs">
                <ArrowRightLeft className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Estimated conversion</p>
                <p className="mt-0.5 break-words font-semibold tabular-nums" aria-live="polite">
                  {currency === "KRW" && previewUsd !== null
                    ? `${krw.format(parsedAmount)} ≈ ${usd.format(previewUsd)}`
                    : currency === "USD" && previewKrw !== null
                      ? `${usd.format(parsedAmount)} ≈ ${krw.format(previewKrw)}`
                      : "Enter an amount to see KRW and USD"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Label htmlFor="transaction-exchange-rate" className="text-xs text-muted-foreground">
                1 USD =
              </Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring">
                <span className="text-xs text-muted-foreground">₩</span>
                <input
                  id="transaction-exchange-rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(event) => setExchangeRate(event.target.value)}
                  required={currency === "USD"}
                  aria-label="KRW value of one US dollar"
                  className="w-24 bg-transparent px-1.5 text-sm font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void fetchLiveRate()}
                disabled={rateFetch.state === "loading"}
                aria-label="Refresh USD to KRW exchange rate"
                className="flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-foreground hover:bg-background disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", rateFetch.state === "loading" && "animate-spin")} aria-hidden="true" />
                {rateFetch.state === "loading" ? "Updating" : "Refresh"}
              </button>
              {rateFetch.fallback && <span className="text-xs text-warning">Fallback rate</span>}
            </div>
            {rateFetch.state === "error" && (
              <p className="mt-2 text-xs text-destructive">Couldn&apos;t fetch a live rate. You can enter the rate manually.</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label>Category</Label>
            <span className="text-xs text-muted-foreground">Scroll to see all</span>
          </div>
          {availableCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">No {type} categories yet.</p>
          ) : (
            <div
              className="max-h-56 space-y-3 overflow-y-auto overscroll-contain rounded-xl border bg-secondary/20 p-2"
              role="group"
              aria-label={`${type} categories`}
            >
              {frequentCategories.length > 0 && (
                <div className="space-y-1.5">
                  <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Often used</p>
                  <div className="grid grid-cols-2 gap-2">
                    {frequentCategories.map((category) => (
                      <CategoryOption
                        key={`frequent-${category.id}`}
                        category={category}
                        selected={categoryId === category.id}
                        onSelect={() => setCategoryId(category.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {frequentCategories.length > 0 && (
                  <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    All categories
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryId("")}
                    aria-pressed={categoryId === ""}
                    className={cn(
                      "flex min-h-12 min-w-0 items-center gap-2 rounded-lg border px-2.5 text-left text-sm font-medium transition-colors active:scale-[0.98]",
                      categoryId === ""
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/20"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <WalletCards className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">No category</span>
                    {categoryId === "" && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                  </button>
                  {availableCategories.map((category) => (
                    <CategoryOption
                      key={category.id}
                      category={category}
                      selected={categoryId === category.id}
                      onSelect={() => setCategoryId(category.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="transaction-description">Description</Label>
          <DescriptionSuggestInput
            id="transaction-description"
            value={description}
            onChange={setDescription}
            onPick={applyDescriptionSuggestion}
            suggestions={descriptionSuggestions}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="transaction-date">Date</Label>
              <button
                type="button"
                onClick={() => setDate(localToday())}
                className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                Today
              </button>
            </div>
            <Input id="transaction-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transaction-payment-method">Payment method</Label>
            <select
              id="transaction-payment-method"
              value={paymentMethodId}
              onChange={(event) => setPaymentMethodId(event.target.value)}
              className="flex h-11 min-h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">None</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon ? `${method.icon} ` : ""}
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="transaction-note">Note (optional)</Label>
          <textarea
            id="transaction-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {mode === "create" && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSaveAsTemplate}
              disabled={savingTemplate}
              className="min-h-9 text-xs font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            >
              {savingTemplate ? "Saving…" : "Save as template"}
            </button>
            {templateMessage && <span className="text-xs text-muted-foreground">{templateMessage}</span>}
          </div>
        )}

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-border px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending} className="min-h-11 flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="min-h-11 flex-1">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {mode === "create" ? "Add transaction" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function CategoryOption({
  category,
  selected,
  onSelect,
}: {
  category: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex min-h-12 min-w-0 items-center gap-2 rounded-lg border px-2.5 text-left text-sm font-medium transition-colors active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/20"
          : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <CategoryIcon icon={category.icon} color={category.color} className="size-7 text-sm" />
      <span className="min-w-0 flex-1 truncate">{category.name}</span>
      {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
    </button>
  );
}

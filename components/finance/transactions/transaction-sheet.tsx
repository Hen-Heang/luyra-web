"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CategoryIcon } from "@/components/finance/ui/finance-primitives";
import { TemplateStrip } from "@/components/finance/transactions/template-strip";
import { getExchangeRate } from "@/lib/api/finance";
import { krw } from "@/lib/finance-format";
import { cn } from "@/lib/utils";
import type { CreateTransactionInput, CreateTransactionTemplateInput } from "@/lib/validation/finance";
import type { Category, Currency, PaymentMethod, Transaction, TransactionTemplate, TransactionType } from "@/types/finance";

export function TransactionSheet({
  mode,
  transaction,
  categories,
  paymentMethods,
  templates,
  defaultDate,
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
  defaultDate: string;
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
            defaultDate={defaultDate}
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
  defaultDate,
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
  defaultDate: string;
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
  const [rateFetch, setRateFetch] = useState<{ state: "idle" | "loading" | "error"; fallback: boolean }>({
    state: "idle",
    fallback: false,
  });
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(transaction?.date ?? defaultDate);
  const [paymentMethodId, setPaymentMethodId] = useState(transaction?.paymentMethodId ?? "");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  const previewKrw =
    currency === "USD" && amount.trim() !== "" && exchangeRate.trim() !== "" && Number.isFinite(Number(amount)) && Number.isFinite(Number(exchangeRate))
      ? Math.round(Number(amount) * Number(exchangeRate))
      : null;

  const availableCategories = categories.filter((category) => category.type === type || category.type === "both");

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setCategoryId((current) =>
      categories.some((category) => category.id === current && (category.type === nextType || category.type === "both"))
        ? current
        : ""
    );
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
    if (next === "USD" && exchangeRate.trim() === "") {
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
          <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
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
              className="w-full min-w-0 bg-transparent text-3xl font-bold tracking-tight tabular-nums outline-none"
            />
          </div>

          {currency === "USD" && (
            <div className="space-y-1.5 rounded-xl border bg-secondary/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="transaction-exchange-rate" className="text-xs text-muted-foreground">
                  Rate: 1 USD =
                </Label>
                {rateFetch.state === "loading" && <span className="text-xs text-muted-foreground">Fetching…</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₩</span>
                <input
                  id="transaction-exchange-rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(event) => setExchangeRate(event.target.value)}
                  required
                  className="h-9 w-28 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => void fetchLiveRate()}
                  disabled={rateFetch.state === "loading"}
                  className="text-xs font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
              {previewKrw !== null && (
                <p className="text-xs text-muted-foreground">
                  Converted: {krw.format(previewKrw)}
                  {rateFetch.fallback ? " · fallback rate, edit if it's stale" : ""}
                </p>
              )}
              {rateFetch.state === "error" && (
                <p className="text-xs text-destructive">Couldn&apos;t fetch a live rate — enter one manually.</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          {availableCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">No {type} categories yet.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryId("")}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors active:scale-[0.98]",
                  categoryId === ""
                    ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary active:bg-secondary hover:text-foreground"
                )}
              >
                No category
              </button>
              {availableCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors active:scale-[0.98]",
                    categoryId === category.id
                      ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary active:bg-secondary hover:text-foreground"
                  )}
                >
                  <CategoryIcon icon={category.icon} color={categoryId === category.id ? null : category.color} className="size-6 text-sm" />
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="transaction-description">Description</Label>
          <Input
            id="transaction-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What was this for?"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="transaction-date">Date</Label>
            <Input id="transaction-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <select
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

      <div className="flex shrink-0 gap-2 border-t border-border px-4 py-4">
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

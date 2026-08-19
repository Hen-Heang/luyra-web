"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { monthBounds, monthLabel } from "@/lib/finance-month";
import {
  createTransaction,
  deleteTransaction,
  listCategories,
  listPaymentMethods,
  listTransactions,
  updateTransaction,
} from "@/lib/api/finance";
import { TransactionForm } from "@/components/finance/transactions/transaction-form";
import { TransactionItem } from "@/components/finance/transactions/transaction-item";
import type { CreateTransactionInput } from "@/lib/validation/finance";
import type { Category, PaymentMethod, Transaction, TransactionType } from "@/types/finance";

const TYPE_TABS: { label: string; value: TransactionType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
];

export function TransactionList() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const { start, end } = monthBounds(monthOffset);
        const result = await listTransactions({
          start,
          end,
          type: typeFilter,
          search: search.trim() || undefined,
          page: targetPage,
        });
        setTransactions((prev) => (targetPage === 0 ? result.transactions : [...prev, ...result.transactions]));
        setHasMore(result.hasMore);
        setPage(targetPage);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load transactions.");
      } finally {
        setLoading(false);
      }
    },
    [monthOffset, typeFilter, search]
  );

  useEffect(() => {
    void (async () => {
      await load(0);
    })();
  }, [load]);

  useEffect(() => {
    let active = true;
    async function loadLookups() {
      try {
        const [cats, methods] = await Promise.all([listCategories(), listPaymentMethods()]);
        if (!active) return;
        setCategories(cats);
        setPaymentMethods(methods);
      } catch {
        // Category/payment-method pickers stay empty; the transaction list above still works.
      }
    }
    void loadLookups();
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(input: CreateTransactionInput) {
    await createTransaction(input);
    setCreating(false);
    await load(0);
  }

  async function handleUpdate(id: string, input: CreateTransactionInput) {
    await updateTransaction(id, input);
    await load(0);
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    await load(0);
  }

  const { start } = monthBounds(monthOffset);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonthOffset((o) => o - 1)} aria-label="Previous month">
            ←
          </Button>
          <span className="text-sm font-medium">{monthLabel(monthOffset)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={monthOffset >= 0}
            aria-label="Next month"
          >
            →
          </Button>
        </div>
        <div className="flex gap-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                typeFilter === tab.value ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Input placeholder="Search description…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {creating ? (
        <TransactionForm
          mode="create"
          categories={categories}
          paymentMethods={paymentMethods}
          defaultDate={start}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)} className="self-start">
          <Plus />
          Add transaction
        </Button>
      )}

      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {transactions.length === 0 && !loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No transactions this month.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              categories={categories}
              paymentMethods={paymentMethods}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(page + 1)}
          disabled={loading}
          className="self-center"
        >
          Load more
        </Button>
      )}
    </div>
  );
}

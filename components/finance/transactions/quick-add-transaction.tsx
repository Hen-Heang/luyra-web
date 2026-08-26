"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { TransactionSheet } from "@/components/finance/transactions/transaction-sheet";
import {
  createTemplate,
  createTransaction,
  deleteTemplate,
  getTransactionSuggestions,
  listCategories,
  listPaymentMethods,
  listTemplates,
} from "@/lib/api/finance";
import { emitTransactionChanged } from "@/lib/finance-events";
import { cn } from "@/lib/utils";
import type { CreateTransactionInput, CreateTransactionTemplateInput } from "@/lib/validation/finance";
import type { Category, PaymentMethod, TransactionSuggestions, TransactionTemplate } from "@/types/finance";

/**
 * A globally-mounted "compose" button — the daily-use shortcut for logging a
 * transaction from anywhere in the app, not just the Transactions page.
 * Sits above the mobile tab bar (Telegram-style floating compose action);
 * on tablet/desktop it floats at the window's bottom-right instead.
 */
export function QuickAddTransaction({ raised }: { raised: boolean }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [suggestions, setSuggestions] = useState<TransactionSuggestions | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    let active = true;
    void (async () => {
      try {
        const [cats, methods, templateList, suggestionData] = await Promise.all([
          listCategories(),
          listPaymentMethods(),
          listTemplates(),
          getTransactionSuggestions(),
        ]);
        if (!active) return;
        setCategories(cats);
        setPaymentMethods(methods);
        setTemplates(templateList);
        setSuggestions(suggestionData);
        setLoaded(true);
      } catch {
        // The sheet still works with empty pickers; category/payment-method
        // selection just won't have options until the next open.
      }
    })();
    return () => {
      active = false;
    };
  }, [open, loaded]);

  async function handleSave(input: CreateTransactionInput) {
    await createTransaction(input);
    emitTransactionChanged();
  }

  async function handleSaveTemplate(input: CreateTransactionTemplateInput) {
    const created = await createTemplate(input);
    setTemplates((prev) => [created, ...prev]);
  }

  async function handleDeleteTemplate(template: TransactionTemplate) {
    const previous = templates;
    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    try {
      await deleteTemplate(template.id);
    } catch {
      setTemplates(previous);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add transaction"
        className={cn(
          "fixed right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring",
          raised ? "bottom-[calc(6rem+env(safe-area-inset-bottom))]" : "bottom-6"
        )}
      >
        <Plus className="size-6" strokeWidth={2.5} aria-hidden />
      </button>

      <TransactionSheet
        mode="create"
        categories={categories}
        paymentMethods={paymentMethods}
        templates={templates}
        suggestions={suggestions}
        open={open}
        onOpenChange={setOpen}
        onSave={handleSave}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </>
  );
}

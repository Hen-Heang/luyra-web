"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { TransactionSheet } from "@/components/finance/transactions/transaction-sheet";
import {
  createTemplate,
  createTransaction,
  deleteTemplate,
  listCategories,
  listPaymentMethods,
  listTemplates,
} from "@/lib/api/finance";
import { emitTransactionChanged } from "@/lib/finance-events";
import type { CreateTransactionInput, CreateTransactionTemplateInput } from "@/lib/validation/finance";
import type { Category, PaymentMethod, TransactionTemplate } from "@/types/finance";

/**
 * A globally-mounted "compose" button — the daily-use shortcut for logging a
 * transaction from anywhere in the app, not just the Transactions page.
 * Sits above the mobile tab bar (Telegram-style floating compose action);
 * on tablet/desktop it floats at the window's bottom-right instead.
 */
export function QuickAddTransaction() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    let active = true;
    void (async () => {
      try {
        const [cats, methods, templateList] = await Promise.all([listCategories(), listPaymentMethods(), listTemplates()]);
        if (!active) return;
        setCategories(cats);
        setPaymentMethods(methods);
        setTemplates(templateList);
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
        className="fixed right-4 bottom-[calc(var(--mobile-nav-inset)+1rem)] z-40 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/15 outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none md:bottom-6 md:size-14"
      >
        <Plus className="size-5.5" strokeWidth={2.4} aria-hidden />
      </button>

      <TransactionSheet
        mode="create"
        categories={categories}
        paymentMethods={paymentMethods}
        templates={templates}
        open={open}
        onOpenChange={setOpen}
        onSave={handleSave}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </>
  );
}

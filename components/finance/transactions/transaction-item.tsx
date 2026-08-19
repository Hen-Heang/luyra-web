"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/finance/transactions/transaction-form";
import { krw, toAmount } from "@/lib/integrations/money-flow/format";
import type {
  Category,
  PaymentMethod,
  Transaction,
  TransactionInput,
} from "@/lib/integrations/money-flow/types";

export function TransactionItem({
  transaction,
  categories,
  paymentMethods,
  onUpdate,
  onDelete,
}: {
  transaction: Transaction;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onUpdate: (id: string, input: TransactionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      await onDelete(transaction.id);
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <div className="p-3">
        <TransactionForm
          mode="edit"
          transaction={transaction}
          categories={categories}
          paymentMethods={paymentMethods}
          defaultDate={transaction.date}
          onSave={async (input) => {
            await onUpdate(transaction.id, input);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const isIncome = transaction.type === "income";
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={isIncome ? "size-4 shrink-0 text-emerald-600" : "size-4 shrink-0 text-rose-600"} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{transaction.description}</p>
          <p className="truncate text-xs text-muted-foreground">
            {transaction.date}
            {transaction.categories?.name ? ` · ${transaction.categories.name}` : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-medium">
          {isIncome ? "+" : "−"}
          {krw.format(toAmount(transaction.amount_krw))}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit transaction">
          <Pencil className="size-4" />
        </Button>
        {confirmingDelete ? (
          <div className="flex items-center gap-1">
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
              Confirm
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete transaction"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

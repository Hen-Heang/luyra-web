"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateTransactionInput } from "@/lib/validation/finance";
import type { Category, PaymentMethod, Transaction, TransactionType } from "@/types/finance";

export function TransactionForm({
  mode,
  transaction,
  categories,
  paymentMethods,
  defaultDate,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit";
  transaction?: Transaction;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  defaultDate: string;
  onSave: (input: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [date, setDate] = useState(transaction?.date ?? defaultDate);
  const [amount, setAmount] = useState(transaction ? String(transaction.amountKrw) : "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(transaction?.paymentMethodId ?? "");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = categories.filter((c) => c.type === type || c.type === "both");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than 0.");
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
        amountKrw: parsedAmount,
        description: description.trim(),
        categoryId: categoryId || null,
        paymentMethodId: paymentMethodId || null,
        note: note.trim() || null,
      });
    } catch {
      setError("Couldn't save the transaction. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        />
        <Input
          type="number"
          min="0"
          step="1"
          placeholder="Amount (KRW)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-36"
        />
      </div>
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">No category</option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">No payment method</option>
          {paymentMethods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {mode === "create" ? "Add transaction" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon, FinanceEmptyState, FinanceErrorState } from "@/components/finance/ui/finance-primitives";
import { DeleteLookupDialog, LookupRowActions } from "@/components/finance/settings/lookup-primitives";
import { PaymentMethodSheet, type PaymentMethodFormValues } from "@/components/finance/settings/payment-method-sheet";
import { ApiError } from "@/lib/api/client";
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from "@/lib/api/finance";
import type { PaymentMethod } from "@/types/finance";

export function PaymentMethodsSection() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PaymentMethod | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Same reload-token approach as CategoriesSection — see the note there.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let active = true;
    listPaymentMethods()
      .then((next) => {
        if (!active) return;
        setPaymentMethods(next);
        setLoadError(false);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  async function handleSave(values: PaymentMethodFormValues) {
    if (sheetMode === "edit" && editing) {
      await updatePaymentMethod(editing.id, values);
    } else {
      await createPaymentMethod(values);
    }
    reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePaymentMethod(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Couldn't delete the payment method. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <FinanceErrorState
        title="Payment methods unavailable"
        description="We couldn't load your payment methods. Try again in a moment."
        onRetry={() => {
          setLoadError(false);
          setLoading(true);
          reload();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div
        className="h-32 rounded-2xl bg-secondary motion-safe:animate-pulse"
        aria-busy="true"
        aria-label="Loading payment methods"
      />
    );
  }

  return (
    <div className="space-y-3">
      {paymentMethods.length === 0 ? (
        <FinanceEmptyState
          icon={CreditCard}
          title="No payment methods yet"
          description="Add a card, cash, or an account to break your spending down by how you paid."
          action={
            <Button
              size="sm"
              onClick={() => {
                setSheetMode("create");
                setEditing(undefined);
                setSheetOpen(true);
              }}
              className="min-h-11"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add payment method
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border bg-card">
            {paymentMethods.map((paymentMethod) => (
              <li key={paymentMethod.id} className="flex items-center gap-3 px-3 py-2">
                <CategoryIcon icon={paymentMethod.icon} color={null} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{paymentMethod.name}</p>
                <LookupRowActions
                  name={paymentMethod.name}
                  onEdit={() => {
                    setSheetMode("edit");
                    setEditing(paymentMethod);
                    setSheetOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteError(null);
                    setDeleteTarget(paymentMethod);
                  }}
                />
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSheetMode("create");
              setEditing(undefined);
              setSheetOpen(true);
            }}
            className="min-h-11"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add payment method
          </Button>
        </>
      )}

      <PaymentMethodSheet
        mode={sheetMode}
        paymentMethod={editing}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
      />

      <DeleteLookupDialog
        isOpen={deleteTarget !== null}
        isDeleting={deleting}
        entityLabel="payment method"
        name={deleteTarget?.name ?? ""}
        error={deleteError}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

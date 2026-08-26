"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon, FinanceEmptyState, FinanceErrorState } from "@/components/finance/ui/finance-primitives";
import {
  CATEGORY_TYPE_LABELS,
  CategorySheet,
  type CategoryFormValues,
} from "@/components/finance/settings/category-sheet";
import { DeleteLookupDialog, LookupRowActions } from "@/components/finance/settings/lookup-primitives";
import { ApiError } from "@/lib/api/client";
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/api/finance";
import type { Category } from "@/types/finance";

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Category | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bumping the token refetches. A refetch after a save or delete deliberately
  // leaves the current list on screen instead of flashing the skeleton again —
  // and it keeps setState out of the effect body, which the lint rule forbids.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let active = true;
    listCategories()
      .then((next) => {
        if (!active) return;
        setCategories(next);
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

  async function handleSave(values: CategoryFormValues) {
    if (sheetMode === "edit" && editing) {
      await updateCategory(editing.id, values);
    } else {
      await createCategory(values);
    }
    reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (error) {
      // A category still referenced by transactions, budgets, or templates comes
      // back as a 409 that names what is holding it. Keep the dialog open so the
      // explanation stays where the user asked for the delete.
      setDeleteError(error instanceof ApiError ? error.message : "Couldn't delete the category. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <FinanceErrorState
        title="Categories unavailable"
        description="We couldn't load your categories. Try again in a moment."
        onRetry={() => {
          setLoadError(false);
          setLoading(true);
          reload();
        }}
      />
    );
  }

  if (loading) {
    return <div className="h-32 rounded-2xl bg-secondary motion-safe:animate-pulse" aria-busy="true" aria-label="Loading categories" />;
  }

  return (
    <div className="space-y-3">
      {categories.length === 0 ? (
        <FinanceEmptyState
          icon={Tags}
          title="No categories yet"
          description="Add your first category to start grouping transactions and setting budgets."
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
              Add category
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border bg-card">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 px-3 py-2">
                <CategoryIcon icon={category.icon} color={category.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_TYPE_LABELS[category.type]}</p>
                </div>
                <LookupRowActions
                  name={category.name}
                  onEdit={() => {
                    setSheetMode("edit");
                    setEditing(category);
                    setSheetOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteError(null);
                    setDeleteTarget(category);
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
            Add category
          </Button>
        </>
      )}

      <CategorySheet
        mode={sheetMode}
        category={editing}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
      />

      <DeleteLookupDialog
        isOpen={deleteTarget !== null}
        isDeleting={deleting}
        entityLabel="category"
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

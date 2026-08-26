"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipSelect } from "@/components/ui/chip-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ColorPicker, IconPicker } from "@/components/finance/settings/lookup-primitives";
import { ApiError } from "@/lib/api/client";
import type { CategoryType, Category } from "@/types/finance";

export const CATEGORY_ICONS = ["🍜", "🛒", "🚕", "🏠", "💡", "📱", "👕", "💊", "🎬", "📚", "✈️", "💼", "🎁", "💰"] as const;
export const CATEGORY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#6b7280"] as const;

// One label per type, shared with CategoriesSection's list rows so the same
// category never reads as "Both" in one place and something else in another.
export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: "Expense",
  income: "Income",
  both: "Income & expense",
};
const TYPE_OPTIONS = Object.values(CATEGORY_TYPE_LABELS);

function labelToType(label: string): CategoryType {
  const entry = (Object.keys(CATEGORY_TYPE_LABELS) as CategoryType[]).find(
    (type) => CATEGORY_TYPE_LABELS[type] === label
  );
  return entry ?? "expense";
}

export interface CategoryFormValues {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export function CategorySheet({
  mode,
  category,
  open,
  onOpenChange,
  onSave,
}: {
  mode: "create" | "edit";
  category?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CategoryFormValues) => Promise<void>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex max-h-[90dvh] w-full gap-0 sm:max-w-lg sm:rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "New category" : "Edit category"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Categories group your transactions and are what budgets are set against."
              : "Renaming a category updates it everywhere it is already used."}
          </SheetDescription>
        </SheetHeader>
        {open && (
          <CategorySheetFields
            key={`${mode}-${category?.id ?? "create"}`}
            mode={mode}
            category={category}
            onSave={onSave}
            onOpenChange={onOpenChange}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CategorySheetFields({
  mode,
  category,
  onSave,
  onOpenChange,
}: {
  mode: "create" | "edit";
  category?: Category;
  onSave: (values: CategoryFormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [type, setType] = useState<CategoryType>(category?.type ?? "expense");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length === 0) {
      setError("Name is required.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), icon, color, type });
      onOpenChange(false);
    } catch (saveError) {
      // A duplicate name comes back as a 409 whose message names the existing
      // category — far more useful than a generic failure line.
      setError(saveError instanceof ApiError ? saveError.message : "Couldn't save the category. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="space-y-1.5">
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Groceries, Transport…"
            maxLength={40}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label id="category-type-label">Applies to</Label>
          <ChipSelect
            options={TYPE_OPTIONS}
            value={CATEGORY_TYPE_LABELS[type]}
            onChange={(label) => setType(labelToType(label))}
          />
        </div>

        <IconPicker id="category-icon-label" label="Icon" icons={CATEGORY_ICONS} value={icon} onChange={setIcon} />
        <ColorPicker id="category-color-label" label="Color" colors={CATEGORY_COLORS} value={color} onChange={setColor} />

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
          {mode === "create" ? "Add category" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

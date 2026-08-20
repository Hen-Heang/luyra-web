"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryIcon } from "@/components/finance/ui/finance-primitives";
import { krw } from "@/lib/finance-format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/finance";

function formatTime(createdAt: string): string | null {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function TransactionRow({
  transaction,
  onEdit,
  onDeleteRequest,
}: {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDeleteRequest: (transaction: Transaction) => void;
}) {
  const isIncome = transaction.type === "income";
  const time = formatTime(transaction.createdAt);
  const metaParts = [
    transaction.categoryName ?? (isIncome ? "Income" : "Uncategorized"),
    transaction.paymentMethodName,
    transaction.note,
  ].filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(transaction)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit(transaction);
        }
      }}
      className="flex min-h-16 cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <CategoryIcon icon={transaction.categoryIcon} color={transaction.categoryColor} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{transaction.description}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{metaParts.join(" · ")}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("font-mono text-sm font-semibold tabular-nums", isIncome ? "text-success" : "text-foreground")}>
          {isIncome ? "+" : "−"}
          {krw.format(transaction.amountKrw)}
        </p>
        {time && <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Actions for ${transaction.description}`}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
          <DropdownMenuItem onSelect={() => onEdit(transaction)}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onDeleteRequest(transaction)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

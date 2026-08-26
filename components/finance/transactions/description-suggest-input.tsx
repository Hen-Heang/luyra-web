"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { krw } from "@/lib/finance-format";
import { cn } from "@/lib/utils";
import type { DescriptionSuggestion } from "@/types/finance";

const MAX_VISIBLE = 6;

/**
 * Ranks the user's own past descriptions against what they've typed so far.
 * A prefix match beats a substring match, and within each group the
 * description used more often wins — the everyday entry surfaces first.
 */
function rankSuggestions(suggestions: DescriptionSuggestion[], query: string): DescriptionSuggestion[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === "") return suggestions.slice(0, MAX_VISIBLE);

  return suggestions
    .map((suggestion) => {
      const value = suggestion.description.toLowerCase();
      if (value === trimmed) return { suggestion, rank: -1 };
      if (value.startsWith(trimmed)) return { suggestion, rank: 0 };
      if (value.includes(trimmed)) return { suggestion, rank: 1 };
      return { suggestion, rank: 2 };
    })
    .filter((entry) => entry.rank >= 0 && entry.rank < 2)
    .sort((a, b) => a.rank - b.rank || b.suggestion.count - a.suggestion.count)
    .slice(0, MAX_VISIBLE)
    .map((entry) => entry.suggestion);
}

export function DescriptionSuggestInput({
  id,
  value,
  onChange,
  onPick,
  suggestions,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (suggestion: DescriptionSuggestion) => void;
  suggestions: DescriptionSuggestion[];
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const visible = useMemo(() => rankSuggestions(suggestions, value), [suggestions, value]);
  const expanded = open && visible.length > 0;

  function choose(suggestion: DescriptionSuggestion) {
    onPick(suggestion);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!expanded) {
      if (event.key === "ArrowDown" && visible.length > 0) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % visible.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? visible.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      // Only swallow Enter when a suggestion is highlighted — otherwise it
      // must still submit the form.
      event.preventDefault();
      choose(visible[activeIndex]);
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={(event) => {
          setOpen(true);
          // The sheet body scrolls, so the dropdown would be clipped if the
          // field sat near its bottom edge. Center the field first.
          event.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        onBlur={() => {
          setOpen(false);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder="What was this for?"
        required
        autoComplete="off"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
      />

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Previous descriptions"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto overscroll-contain rounded-xl border bg-popover p-1 shadow-lg"
        >
          {visible.map((suggestion, index) => (
            <li key={`${suggestion.type}-${suggestion.description}`}>
              <button
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                // The list closes on blur, so commit on mousedown — a click
                // would fire after the input has already lost focus.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                  index === activeIndex ? "bg-secondary" : "hover:bg-secondary/60"
                )}
              >
                <History className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{suggestion.description}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {suggestion.categoryName ? `${suggestion.categoryName} · ` : ""}
                    used {suggestion.count}×
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {krw.format(suggestion.amountKrw)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

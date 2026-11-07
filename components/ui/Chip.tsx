"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type ChipProps = {
  label: ReactNode;
  sub?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function Chip({
  label,
  sub,
  selected,
  disabled,
  onSelect,
}: ChipProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      whileHover={reduce || disabled ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex min-h-11 min-w-0 flex-col items-start justify-center gap-1 rounded-card border px-3.5 py-2.5 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40 sm:px-4",
        selected
          ? "border-gold-line-strong bg-gold/15"
          : "border-gold-line bg-elevated/50 hover:border-gold-line-strong"
      )}
    >
      <span className="flex w-full items-start justify-between gap-2 text-sm font-medium leading-snug text-cream">
        <span className="min-w-0 break-words whitespace-normal">{label}</span>
        {selected && (
          <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
        )}
      </span>
      {sub && (
        <span className="w-full text-xs text-muted tabular-nums">
          {sub}
        </span>
      )}
    </motion.button>
  );
}
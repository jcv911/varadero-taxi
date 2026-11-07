"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type GoldButtonProps = {
  className?: string;
  children?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export const GoldButton = forwardRef<HTMLButtonElement, GoldButtonProps>(
  ({ className, children, loading, disabled, type, onClick }, ref) => {
    const reduce = useReducedMotion();
    return (
      <motion.button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "group/is-sheen relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-btn bg-gold px-6 font-semibold text-deep outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        whileHover={reduce || disabled ? undefined : { y: -1 }}
        whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        disabled={disabled || loading}
        onClick={onClick}
      >
        <span aria-hidden className="btn-sheen" />
        {loading && (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        )}
        {children}
      </motion.button>
    );
  }
);

GoldButton.displayName = "GoldButton";

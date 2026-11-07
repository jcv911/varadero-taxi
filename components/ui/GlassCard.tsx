import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-gold-line bg-glass backdrop-blur-glass transition-colors duration-300 hover:border-gold-line-strong",
        className
      )}
    >
      {children}
    </div>
  );
}
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const FAQ_ITEMS = ["1", "2", "3", "4"] as const;

export function FAQAccordion() {
  const t = useTranslations("faq");
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(FAQ_ITEMS[0]);
  // TODO-CONFIRMAR (ver PROGRESS.md § TODO-CONFIRMAR): falta la política real de espera del conductor.
  // 'a3' (espera gratis tras el aterrizaje) y 'a4' (minutos de espera en recogida) dicen en el texto
  // visible que el dato queda por confirmar; sustituir los reglones por el texto final y quitar ese aviso.

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-line bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wider text-gold uppercase shadow-[0_0_12px_rgba(232,169,75,0.12)]">
          <HelpCircle className="h-3.5 w-3.5 text-gold" />
          <span>FAQ</span>
        </span>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-cream sm:text-4xl">
          {t("title")}
        </h2>
      </div>
      <div className="mt-10 space-y-3.5">
        {FAQ_ITEMS.map((id) => {
          const expanded = open === id;
          return (
            <div
              key={id}
              className={cn(
                "overflow-hidden rounded-card border transition-all duration-300",
                expanded
                  ? "border-gold-line-strong bg-gradient-to-b from-surface/95 to-deep/90 shadow-[0_4px_24px_rgba(232,169,75,0.08)] ring-1 ring-gold/20"
                  : "border-gold-line bg-base/50 hover:border-gold-line-strong/60 hover:bg-base/80"
              )}
            >
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : id)}
                  aria-expanded={expanded}
                  aria-controls={`faq-panel-${id}`}
                  id={`faq-button-${id}`}
                  className="flex min-h-[52px] w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-6"
                >
                  <span className={cn("transition-colors", expanded ? "font-semibold text-gold" : "text-cream hover:text-gold")}>
                    {t(`q${id}`)}
                  </span>
                  <motion.span
                    aria-hidden
                    animate={reduce ? undefined : { rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                      expanded
                        ? "border-gold/50 bg-gold/15 text-gold"
                        : "border-gold-line bg-elevated/50 text-muted"
                    )}
                  >
                    <ChevronDown aria-hidden className="h-4 w-4" strokeWidth={expanded ? 2.2 : 1.75} />
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id={`faq-panel-${id}`}
                    role="region"
                    aria-labelledby={`faq-button-${id}`}
                    initial={reduce ? { opacity: 1 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="border-t border-gold-line/40 px-5 pb-5 pt-3 text-sm leading-relaxed text-muted sm:px-6"
                  >
                    {t(`a${id}`)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

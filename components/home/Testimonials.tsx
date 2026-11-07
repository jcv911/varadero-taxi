"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const ITEMS = [1, 2, 3, 4] as const;

// TODO-CONFIRMAR: testimonios provisionales de ejemplo hasta tener reseñas
// verificadas del negocio (Google/TripAdvisor); nota visible al pie de la sección.
// Una futura puntuación media (⭐) solo se muestra cuando exista y esté verificada.

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function Testimonials() {
  const t = useTranslations("testimonials");
  const reduce = useReducedMotion();

  return (
    <section
      id="testimonials"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-line bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wider text-gold uppercase shadow-[0_0_12px_rgba(232,169,75,0.12)]">
          <Quote className="h-3.5 w-3.5 text-gold" />
          <span>{t("kicker")}</span>
        </span>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-cream sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-cream/80">{t("subtitle")}</p>
      </div>
      <motion.ul
        className="mt-10 grid gap-4 sm:grid-cols-2"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={reduce ? undefined : { show: { transition: { staggerChildren: 0.06 } } }}
      >
        {ITEMS.map((i) => (
          <motion.li
            key={i}
            variants={variants}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="h-full">
              <figure className="flex h-full flex-col gap-3 p-6 text-left">
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 text-gold"
                      fill="currentColor"
                      strokeWidth={1}
                    />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-cream/90">
                  {t(`text${i}`)}
                </blockquote>
                <figcaption className="text-xs text-cream/70">
                  <strong className="block font-medium text-cream">
                    {t(`name${i}`)}
                  </strong>
                  <span className="mt-0.5 block">{t(`trip${i}`)}</span>
                </figcaption>
              </figure>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ul>
      <p
        className="mt-6 text-center text-xs italic text-cream/50"
        title={t("provisional")}
      >
        {t("provisional")}
      </p>
    </section>
  );
}

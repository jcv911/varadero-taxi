"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CalendarCheck, MapPin, Plane } from "lucide-react";

const STEPS = ["s1", "s2", "s3"] as const;

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function HowItWorks() {
  const t = useTranslations("how");
  const reduce = useReducedMotion();
  const icons = [MapPin, CalendarCheck, Plane];

  return (
    <section id="how" className="border-y border-gold-line bg-base">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <h2 className="font-display text-3xl tracking-tight text-cream sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>
        {/* Contenedor relativo para alojar la línea conectora desktop */}
        <div className="relative mt-12 sm:mt-16">
          {/* Línea conectora dorada entre pasos (sólo en tablet/desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[15%] right-[15%] top-12 hidden h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent sm:block"
          />

          <motion.ol
            className="grid gap-6 sm:grid-cols-3 sm:gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={reduce ? undefined : { show: { transition: { staggerChildren: 0.12 } } }}
          >
            {STEPS.map((s, i) => {
              const Icon = icons[i];
              return (
                <motion.li
                  key={s}
                  variants={variants}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex flex-col items-center gap-3.5 rounded-card border border-gold-line bg-gradient-to-b from-surface/90 to-deep/90 p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-gold-line-strong hover:shadow-[0_8px_30px_rgba(232,169,75,0.1)] sm:p-7"
                >
                  {/* Círculo del icono elevado */}
                  <div className="relative z-10">
                    <span
                      aria-hidden
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-line-strong bg-gold/10 shadow-[0_0_15px_rgba(232,169,75,0.15)] transition-transform duration-300 group-hover:scale-110 group-hover:bg-gold/20"
                    >
                      <Icon className="h-6 w-6 text-gold" strokeWidth={1.75} />
                    </span>
                    {/* Badge numérico sutil sobre el icono */}
                    <span
                      aria-hidden
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gold-line bg-base text-[11px] font-bold text-gold"
                    >
                      {i + 1}
                    </span>
                  </div>

                  {/* Número decorativo de fondo */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-4 top-2 font-display text-5xl font-extrabold text-gold/[0.07] select-none group-hover:text-gold/[0.12] transition-colors"
                  >
                    0{i + 1}
                  </span>

                  <h3 className="font-display text-lg font-medium text-cream group-hover:text-gold transition-colors">
                    {t(`${s}_title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{t(`${s}_desc`)}</p>
                </motion.li>
              );
            })}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
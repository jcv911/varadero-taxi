"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  BadgeCheck,
  HandCoins,
  MessageCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const FEATURES: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  { icon: Wallet, title: "fixed_price_title", desc: "fixed_price_desc" },
  { icon: HandCoins, title: "cash_title", desc: "cash_desc" },
  { icon: BadgeCheck, title: "confirm_title", desc: "confirm_desc" },
  { icon: MessageCircle, title: "whatsapp_title", desc: "whatsapp_desc" },
];

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function FeaturesGrid() {
  const t = useTranslations("features");
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-tight text-cream sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>
      <motion.ul
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={reduce ? undefined : { show: { transition: { staggerChildren: 0.05 } } }}
      >
        {FEATURES.map((f) => (
          <motion.li
            key={f.title}
            variants={variants}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3 rounded-card border border-gold-line bg-base/60 p-6 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-line-strong bg-gold/10 shadow-[0_0_24px_rgba(232,169,75,0.15)]">
              <f.icon aria-hidden className="h-6 w-6 text-gold" strokeWidth={1.5} />
            </span>
            <h3 className="font-display text-lg text-cream">{t(f.title)}</h3>
            <p className="text-sm text-muted">{t(f.desc)}</p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
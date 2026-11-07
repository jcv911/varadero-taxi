"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "en" ? "es" : "en";

  function toggle() {
    router.replace(pathname, { locale: next, scroll: false });
  }

  return (
    // El nombre accesible empieza por el texto visible ("ES"/"EN") y luego el destino: WCAG 2.5.3.
    <button
      type="button"
      onClick={toggle}
      aria-label={t("switch_language", { current: locale.toUpperCase(), target: next.toUpperCase() })}
      className="relative min-h-11 min-w-14 overflow-hidden rounded-btn px-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={locale}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-11 items-center justify-center text-sm font-semibold tracking-wide text-cream"
        >
          {locale.toUpperCase()}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
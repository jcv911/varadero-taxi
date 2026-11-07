"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { scrollToBooking } from "@/lib/scroll";

const NAV_ITEMS = [
  { key: "fleet", href: "/#fleet" },
  { key: "how", href: "/#how" },
  { key: "faq", href: "/#faq" },
  { key: "contact", href: "/#contact" },
] as const;

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[100] bg-deep/75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("menu")}
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-gold-line bg-base/95 backdrop-blur-glass"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-end border-b border-gold-line p-4">
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-btn text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
              >
                <X aria-hidden className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex flex-col gap-2 overflow-y-auto p-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  scrollToBooking();
                }}
                className="min-h-11 rounded-btn border border-gold-line bg-elevated/60 px-4 text-left text-sm font-semibold text-cream outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:border-gold-line-strong"
              >
                {t("book")}
              </button>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  className="flex min-h-11 items-center rounded-btn px-4 text-sm text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="my-2 border-t border-gold-line/40" />
              <Link
                href="/privacidad"
                onClick={onClose}
                className="flex min-h-11 items-center rounded-btn px-4 text-sm text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/terminos"
                onClick={onClose}
                className="flex min-h-11 items-center rounded-btn px-4 text-sm text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
              >
                {tf("terms")}
              </Link>
              <Link
                href="/cancelacion"
                onClick={onClose}
                className="flex min-h-11 items-center rounded-btn px-4 text-sm text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
              >
                {tf("cancellation")}
              </Link>
            </nav>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
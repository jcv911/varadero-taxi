"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import { GoldButton } from "@/components/ui/GoldButton";
import { scrollToBooking } from "@/lib/scroll";
import { cn } from "@/lib/cn";

const logoVariants: Variants = {
  hidden: { scale: 0.92, opacity: 0 },
  show: { scale: 1, opacity: 1 },
};

const NAV_ITEMS = [
  { key: "fleet", href: "#fleet" },
  { key: "how", href: "#how" },
  { key: "faq", href: "#faq" },
  { key: "contact", href: "#contact" },
] as const;

export function SiteHeader() {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <motion.header
      initial="hidden"
      animate="show"
      variants={logoVariants}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled || menuOpen
          ? "border-b border-gold-line bg-glass backdrop-blur-glass"
          : "border-b border-transparent bg-transparent"
      )}
      style={{ transitionTimingFunction: "var(--ease-lux)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <Link
          href="/#hero"
          className="flex min-h-11 min-w-0 items-center whitespace-nowrap font-display text-lg tracking-tight text-cream outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {t("siteName")}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={`/${item.href}`}
              className="flex min-h-11 items-center rounded-btn px-3 text-sm font-medium text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
            >
              {tn(item.key)}
            </Link>
          ))}
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
          <GoldButton
            onClick={scrollToBooking}
            className="ml-1 min-h-11 px-5 text-sm"
          >
            {tn("book")}
          </GoldButton>
        </nav>

        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={tn("open_menu")}
            aria-expanded={menuOpen}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-btn text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
          >
            <Menu aria-hidden className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </motion.header>
  );
}
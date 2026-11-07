"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { scrollToBooking } from "@/lib/scroll";
import { useBookingStore } from "@/lib/bookingStore";

export function StickyMobileCTA() {
  const t = useTranslations("nav");
  const step = useBookingStore((s) => s.step);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const widget = document.getElementById("widget");
    if (!widget) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(!entries[0].isIntersecting),
      { threshold: 0 }
    );
    io.observe(widget);
    return () => io.disconnect();
  }, []);

  if (!visible || step === 5) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-line bg-glass p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-glass sm:hidden">
      <button
        type="button"
        onClick={scrollToBooking}
        className="min-h-11 w-full rounded-btn bg-gold text-sm font-semibold text-deep outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {t("book")}
      </button>
    </div>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useBookingStore } from "@/lib/bookingStore";
import { type BookingData } from "@/lib/schemas";
import { consumePendingDeepLink } from "@/lib/deepLink";
import { Check, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ServiceModeToggle } from "./ServiceModeToggle";
import { RoutePicker } from "./RoutePicker";
import { DateTimePicker } from "./DateTimePicker";
import { VehicleClassSelector } from "./VehicleClassSelector";
import { HoursPicker } from "./HoursPicker";
import { BookingReview } from "./BookingReview";
import { BookingSummaryBar } from "./BookingSummaryBar";
import { ContactSheet } from "./ContactSheet";
import { BookingSuccess } from "./BookingSuccess";

const STEP_LABELS = ["step_route", "step_schedule", "step_vehicle", "step_review"] as const;

type Phase = "form" | "submitting" | "success";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function BookingWidget() {
  const t = useTranslations("booking");
  const step = useBookingStore((s) => s.step);
  const mode = useBookingStore((s) => s.mode);
  const setStep = useBookingStore((s) => s.setStep);
  const [phase, setPhase] = useState<Phase>("form");
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ref: string; priceUsd: number } | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // One key per booking attempt: retrying the same attempt (double tap, dropped response,
  // resubmit after an error) resolves to the booking it already created instead of a
  // duplicate row. Cleared only when the visitor starts a new booking.
  const idempotencyKeyRef = useRef<string | null>(null);
  const reduce = useReducedMotion();

  const handleCloseSheet = useCallback(() => {
    setStep(4);
    triggerRef.current?.focus();
  }, [setStep]);

  useEffect(() => {
    if (phase !== "success") return;
    requestAnimationFrame(() => {
      document.getElementById("widget")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
    });
  }, [phase, reduce]);

  useEffect(() => {
    if (step !== 4) return;
    requestAnimationFrame(() => {
      document.getElementById("widget")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
    });
  }, [step, reduce]);

  // El estado persistido solo guarda nombre, whatsapp y email (nada que cambie el
  // diseño), así que el widget se puede pintar en el servidor con los valores por
  // defecto y parchear después sin mover la página.
  useEffect(() => {
    const unsub = useBookingStore.persist.onFinishHydration(() => {
      const patch = consumePendingDeepLink();
      if (patch) useBookingStore.getState().update(patch);
    });
    void useBookingStore.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    setServerError(null);
  }, [step]);

  useEffect(() => {
    if (step === 5 && document.activeElement instanceof HTMLElement) {
      triggerRef.current = document.activeElement;
    }
  }, [step]);

  useEffect(() => {
    if (step !== 5) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseSheet();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [step, handleCloseSheet]);

  const handleSubmit = useCallback(
    async (data: BookingData, honeypot: string) => {
      setPhase("submitting");
      setServerError(null);
      if (!idempotencyKeyRef.current) idempotencyKeyRef.current = newIdempotencyKey();
      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            honeypot,
            idempotencyKey: idempotencyKeyRef.current,
          }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error ?? "unknown");
        }
        setBooking(data);
        setResult(body);
        setPhase("success");
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "network");
        setPhase("form");
      }
    },
    []
  );

  function handleNew() {
    useBookingStore.getState().resetAfterBooking();
    idempotencyKeyRef.current = null;
    setStep(1);
    setPhase("form");
    setResult(null);
    setBooking(null);
  }

  if (phase === "success" && booking && result) {
    return (
      <div className="flex w-full justify-center">
        <BookingSuccess
          ref={result.ref}
          priceUsd={result.priceUsd}
          booking={{
            mode: booking.mode,
            hours: booking.hours,
            routeId: booking.routeId,
            direction: booking.direction,
            customDestination: booking.customDestination,
            vehicleId: booking.vehicleId,
            date: booking.date,
            time: booking.time,
            passengers: booking.passengers,
            luggage: booking.luggage,
            hotelPickup: booking.hotelPickup,
            otherAddress: booking.otherAddress,
          }}
          onNew={handleNew}
        />
      </div>
    );
  }

  return (
    <>
      <GlassCard className="flex max-h-[calc(100dvh-6rem)] w-full max-w-2xl flex-col overflow-hidden sm:max-h-none">
        {/* Barra de progreso visual luxury */}
        <div className="relative border-b border-gold-line/70 bg-gradient-to-b from-surface/80 to-surface/40">
          {/* Línea de fondo del progreso */}
          <div aria-hidden className="absolute left-0 top-0 h-[2px] w-full bg-gold/10">
            <div
              className="h-full bg-gradient-to-r from-gold/60 via-gold to-gold shadow-[0_0_8px_rgba(232,169,75,0.8)] transition-all duration-300 ease-out"
              style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }}
            />
          </div>

          <nav aria-label={t("steps_label")} className="flex shrink-0">
            {STEP_LABELS.map((key, i) => {
              const n = (i + 1) as 1 | 2 | 3 | 4;
              const active = step === n;
              const done = step > n;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => done && setStep(n)}
                  disabled={!done || phase === "submitting"}
                  aria-current={active ? "step" : undefined}
                  className={`group relative flex min-h-12 flex-1 items-center justify-center gap-1.5 px-2 py-3 text-xs sm:gap-2 sm:px-4 sm:text-sm font-medium transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold ${
                    active
                      ? "text-gold font-semibold"
                      : done
                        ? "text-cream hover:text-gold cursor-pointer"
                        : "text-muted/80 cursor-default"
                  }`}
                >
                  {/* El número NO va aria-hidden: forma parte del nombre accesible junto a la
                      etiqueta, que en móvil se oculta visualmente pero sigue en el nombre
                      (si el nombre no contuviera el texto visible, fallaría WCAG 2.5.3). */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      active
                        ? "bg-gold text-deep shadow-[0_0_12px_rgba(232,169,75,0.6)] scale-105"
                        : done
                          ? "bg-gold/25 text-gold border border-gold/40 group-hover:bg-gold/35"
                          : "bg-elevated/70 text-muted/80 border border-gold-line/40"
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      n
                    )}
                  </span>
                  <span className="sr-only sm:not-sr-only tracking-tight">{t(key)}</span>
                  {i < STEP_LABELS.length - 1 && (
                    <ChevronRight
                      aria-hidden
                      className="hidden sm:inline-block h-3.5 w-3.5 text-muted/30 ml-auto mr-0"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:overflow-visible sm:p-6">
          {step === 1 && <ServiceModeToggle />}

          <motion.div
            key={step}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            {step === 1 && (mode === "trip" ? <RoutePicker /> : <HoursPicker />)}
            {step === 2 && <DateTimePicker />}
            {step === 3 && <VehicleClassSelector />}
            {step === 4 && <BookingReview />}
          </motion.div>
        </div>

        {step < 5 && <BookingSummaryBar />}
      </GlassCard>

      {/* El portal necesita `document`: en el servidor no existe y el contenido
          solo aparece con step 5, así que la diferencia no rompe la hidratación. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {step === 5 && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={t("step_contact")}
                onClick={(e) => {
                  if (e.target === e.currentTarget && phase !== "submitting") {
                    handleCloseSheet();
                  }
                }}
                className="fixed inset-0 z-[110] flex items-end justify-center bg-deep/80 backdrop-blur-md sm:items-center sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain"
                  initial={{ y: 48, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 48, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ContactSheet
                    submitting={phase === "submitting"}
                    serverError={serverError}
                    onClose={handleCloseSheet}
                    onSubmit={handleSubmit}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

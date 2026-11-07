"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { useBookingStore, bookingToAPI, selectPrice } from "@/lib/bookingStore";
import { bookingSchema, type BookingData, type BookingState } from "@/lib/schemas";
import { formatUsd, getRoute } from "@/lib/routes";
import { journeyLabel } from "@/lib/journey";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { GoldButton } from "@/components/ui/GoldButton";
import { cn } from "@/lib/cn";
import { VEHICLES } from "@/lib/vehicles";

function fieldError(issue: { message?: string; path: PropertyKey[] }): string {
  const path = String(issue.path[0] ?? "");
  if (issue.message === "required_for_airport") return "required_for_airport";
  if (issue.message === "date_too_soon") return "date_too_soon";
  if (issue.message === "date_too_far") return "date_too_far";
  if (issue.message === "invalid_date") return "invalid_date";
  if (issue.message === "vehicle_capacity") return "vehicle_capacity";
  if (path === "whatsapp") return "invalid_phone";
  if (path === "email") return "invalid_email";
  if (path === "consent") return "consent_required";
  return "required_field";
}

export function ContactSheet({
  submitting,
  serverError,
  onClose,
  onSubmit,
}: {
  submitting: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (data: BookingData, honeypot: string) => void;
}) {
  const t = useTranslations("booking");
  const tn = useTranslations("nav");
  const te = useTranslations("errors");
  const tc = useTranslations("contact");
  const tz = useTranslations("zones");
  const tv = useTranslations("vehicles");

  const state = useBookingStore();
  const vehicle = VEHICLES[state.vehicleId];
  const route = state.mode === "trip" && state.routeId ? getRoute(state.routeId) : undefined;
  const internal = !!route?.internal;
  const isAirport = route?.kind === "airport";
  const price = useBookingStore(selectPrice);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");

  function update(patch: Partial<BookingState>) {
    useBookingStore.getState().update(patch);
  }

  const varaderoPointLabel = internal
    ? tc("point_varadero_internal")
    : state.mode === "trip" && state.direction === "to"
      ? tc("point_varadero_to")
      : tc("point_varadero_from");

  const otherLabel = internal
    ? tc("destination_internal")
    : state.direction === "to"
      ? tc("pickup_other")
      : tc("destination_other");

  const journey = state.mode === "hours" ? `${state.hours} h` : route
    ? journeyLabel(state.direction, route, (z) => tz(z))
    : t("route_not_selected");

  function whatsappMessage(): string {
    const data = bookingToAPI(state);
    const lines = [
      t("your_reservation"),
      journey,
      `${data.hotelPickup}${data.otherAddress ? " · " + data.otherAddress : ""}`,
      `${state.date} ${state.time}`,
      `${state.passengers} ${t("pax_label")} · ${state.luggage} ${t("bags_label")}`,
      formatUsd(price),
    ];
    if (data.flightNumber) lines.splice(3, 0, `${tc("flight_number")}: ${data.flightNumber}`);
    return lines.filter(Boolean).join("\n");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = bookingSchema.safeParse(bookingToAPI(state));
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const iss of result.error.issues) {
        const key = String(iss.path[0] ?? "form");
        if (!next[key]) next[key] = fieldError(iss);
      }
      setIssues(next);
      if (next.date || next.time) useBookingStore.getState().setStep(2);
      return;
    }
    setIssues({});
    onSubmit(result.data, honeypot);
  }

  const inputCls = (hasError: boolean) =>
    cn(
      "min-h-11 w-full rounded-btn border bg-elevated/60 px-4 text-sm text-cream outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
      hasError ? "border-error" : "border-gold-line focus:border-gold-line-strong"
    );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid w-full gap-5 rounded-t-2xl border border-gold-line bg-base/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-glass sm:rounded-card sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-cream">{t("step_contact")}</h2>
          <p className="mt-0.5 text-sm font-medium tabular-nums text-gold">{journey}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={tn("close")}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-btn text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-cream"
        >
          <X aria-hidden className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={tc("name")} issue={issues.name ? te(issues.name) : undefined}>
          <input
            id="name"
            className={inputCls(!!issues.name)}
            value={state.name}
            onChange={(e) => update({ name: e.target.value })}
            autoComplete="name"
          />
        </Field>
        <Field name="whatsapp" label={tc("whatsapp")} issue={issues.whatsapp ? te(issues.whatsapp) : undefined}>
          <input
            id="whatsapp"
            className={inputCls(!!issues.whatsapp)}
            value={state.whatsapp}
            onChange={(e) => update({ whatsapp: e.target.value })}
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
      </div>

      <Field name="email" label={tc("email")} issue={issues.email ? te(issues.email) : undefined}>
        <input
          id="email"
          className={inputCls(!!issues.email)}
          type="email"
          value={state.email}
          onChange={(e) => update({ email: e.target.value })}
          autoComplete="email"
        />
      </Field>

      <Field name="hotelPickup" label={varaderoPointLabel} issue={issues.hotelPickup ? te(issues.hotelPickup) : undefined}>
        <input
          id="hotelPickup"
          className={inputCls(!!issues.hotelPickup)}
          value={state.hotelPickup}
          onChange={(e) => update({ hotelPickup: e.target.value })}
          autoComplete="street-address"
        />
      </Field>

      {isAirport ? (
        <Field name="flightNumber" label={tc("flight_number")} issue={issues.flightNumber ? te(issues.flightNumber) : undefined}>
          <input
            id="flightNumber"
            className={inputCls(!!issues.flightNumber)}
            value={state.flightNumber}
            onChange={(e) => update({ flightNumber: e.target.value })}
            autoComplete="off"
          />
        </Field>
      ) : (
        <Field
          name="otherAddress"
          label={otherLabel}
          issue={issues.otherAddress ? te(issues.otherAddress) : undefined}
        >
          <input
            id="otherAddress"
            className={inputCls(!!issues.otherAddress)}
            value={state.otherAddress}
            onChange={(e) => update({ otherAddress: e.target.value })}
            autoComplete="street-address"
          />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Stepper
          label={`${tc("passengers")} (${t("pax_label")})`}
          value={state.passengers}
          min={1}
          max={vehicle.passengers}
          onMinus={() => update({ passengers: Math.max(1, state.passengers - 1) })}
          onPlus={() => update({ passengers: Math.min(vehicle.passengers, state.passengers + 1) })}
        />
        <Stepper
          label={tc("luggage")}
          value={state.luggage}
          min={0}
          max={vehicle.luggage}
          onMinus={() => update({ luggage: Math.max(0, state.luggage - 1) })}
          onPlus={() => update({ luggage: Math.min(vehicle.luggage, state.luggage + 1) })}
        />
      </div>

      <p className="-mt-3 text-xs text-muted">
        {tv(state.vehicleId)} · {t("capacity_label")}: {vehicle.passengers} {t("pax_label")} · {vehicle.luggage} {t("bags_label")}
      </p>
      {(issues.passengers || issues.luggage) && (
        <p role="alert" className="text-sm text-error">{te("vehicle_capacity")}</p>
      )}

      <Field name="notes" label={tc("notes")} issue={issues.notes ? te(issues.notes) : undefined}>
        <textarea
          id="notes"
          className={cn(inputCls(!!issues.notes), "min-h-20 py-3")}
          value={state.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </Field>

      {serverError && (
        <div className="flex flex-col gap-3 rounded-btn border border-error/40 bg-error/10 p-4">
          <p role="alert" className="text-sm text-error">
            {t("submit_error")}
          </p>
          <a
            href={buildWhatsAppLink(whatsappMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn border border-gold-line-strong px-6 text-sm font-semibold text-gold outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:bg-gold/10"
          >
            {t("reserve_whatsapp")}
          </a>
        </div>
      )}

      <div className="flex items-start gap-3">
        <input
          id="consent-checkbox"
          type="checkbox"
          checked={state.consent}
          onChange={(e) => update({ consent: e.target.checked })}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-gold"
        />
        <span className="text-xs leading-relaxed text-muted">
          <label htmlFor="consent-checkbox" className="cursor-pointer">
            {tc("consent")}
          </label>{" "}
          <Link
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gold underline underline-offset-2 hover:text-gold-hover"
          >
            {tc("privacy_link")}
          </Link>
        </span>
      </div>
      {issues.consent && (
        <p role="alert" className="-mt-3 text-sm text-error">
          {te(issues.consent)}
        </p>
      )}

      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <GoldButton type="submit" loading={submitting} disabled={submitting} className="w-full">
        {t("confirm_booking")}
      </GoldButton>
    </form>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
  min,
  max,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-btn border border-gold-line bg-elevated/60 px-3">
        <button
          type="button"
          aria-label="−"
          onClick={onMinus}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-btn text-muted outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-30 hover:text-gold"
        >
          <Minus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="tabular-nums text-sm font-semibold text-cream">
          {value}
        </span>
        <button
          type="button"
          aria-label="+"
          onClick={onPlus}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-btn text-muted outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-30 hover:text-gold"
        >
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  issue,
  children,
}: {
  name: string;
  label: string;
  issue?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
      {issue && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-error">
          {issue}
        </p>
      )}
    </div>
  );
}

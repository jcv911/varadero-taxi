import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function NotFoundPage() {
  const t = await getTranslations("notFound");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-6xl text-gold" aria-hidden>
        404
      </p>
      <h1 className="font-display text-2xl text-cream">{t("title")}</h1>
      <p className="text-muted">{t("desc")}</p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-btn bg-gold px-6 font-semibold text-deep outline-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {t("back")}
      </Link>
    </main>
  );
}
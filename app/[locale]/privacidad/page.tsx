import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  const tn = await getTranslations("notFound");

  return (
    <div className="flex min-h-dvh flex-col bg-deep">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gold outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-gold-hover"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          <span>{tn("back")}</span>
        </Link>
        <h1 className="mb-8 font-display text-3xl tracking-tight text-cream sm:text-4xl">
          {t("title")}
        </h1>
        <div className="space-y-4 text-sm leading-relaxed text-cream/90 sm:text-[16px]">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
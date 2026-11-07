import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";

type Props = {
  params: Promise<{ locale: string }>;
};

// TODO-CONFIRMAR: texto legal provisional; el final será revisado y aprobado
// por el negocio antes del lanzamiento público (igual que la política de privacidad).
export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terminos");
  const tn = await getTranslations("notFound");

  const paragraphs = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const;

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
        <div className="space-y-4 text-sm leading-relaxed text-cream/90 sm:text-base">
          {paragraphs.map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

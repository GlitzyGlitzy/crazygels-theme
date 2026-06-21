import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Mail, PackageCheck, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { getLocaleUrl, isLocale, localeDomains, localizedLandingCopy, locales, type Locale } from '@/lib/i18n';

export const revalidate = 300;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  const copy = localizedLandingCopy[rawLocale];

  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    alternates: {
      canonical: getLocaleUrl(rawLocale),
      languages: {
        en: getLocaleUrl('en'),
        de: getLocaleUrl('de'),
        fr: getLocaleUrl('fr'),
        'x-default': 'https://crazygels.com',
      },
    },
    openGraph: {
      title: copy.metadataTitle,
      description: copy.metadataDescription,
      url: getLocaleUrl(rawLocale),
      siteName: 'Crazy Gels',
      locale: rawLocale === 'de' ? 'de_DE' : rawLocale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Crazy Gels beauty routines' }],
    },
  };
}

export default async function LocalizedLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const copy = localizedLandingCopy[locale];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: copy.metadataTitle,
    url: getLocaleUrl(locale),
    inLanguage: locale,
    description: copy.metadataDescription,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Crazy Gels',
      url: 'https://crazygels.com',
    },
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DynamicHeader />

      <main>
        <section className="relative overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4AA]/40 to-transparent" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1fr_0.85fr] lg:gap-16 lg:py-24">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#00D4AA]">
                  {copy.eyebrow}
                </p>
                <LanguageSwitcher activeLocale={locale} compact />
              </div>

              <h1 className="max-w-3xl font-serif text-4xl font-light leading-tight text-[#E8E8E8] md:text-6xl">
                {copy.headline}
                <br />
                <span className="italic text-[#00D4AA]">{copy.accent}</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#CCCCCC] md:text-lg">
                {copy.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/consult"
                  className="group inline-flex items-center justify-center gap-3 bg-[#00D4AA] px-8 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-[#0A0A0A] transition-all hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]"
                >
                  {copy.primaryCta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/collections"
                  className="inline-flex items-center justify-center border border-[#00D4AA]/35 px-8 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-[#00D4AA] transition-colors hover:bg-[#00D4AA]/10"
                >
                  {copy.secondaryCta}
                </Link>
              </div>

              <p className="mt-5 text-xs text-[#CCCCCC]">{copy.reassurance}</p>
            </div>

            <div className="border border-[#1A1A1A] bg-[#111111] p-5 md:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#00D4AA]" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#E8E8E8]">
                  {copy.promiseTitle}
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {copy.promises.map((promise) => (
                  <div key={promise.title} className="flex gap-3 border border-[#1A1A1A] bg-black/20 p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4AA]" aria-hidden="true" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#E8E8E8]">{promise.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#CCCCCC]">{promise.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'EN', value: localeDomains.en },
                  { label: 'DE', value: localeDomains.de },
                  { label: 'FR', value: localeDomains.fr },
                ].map((domain) => (
                  <div key={domain.label} className="border border-[#1A1A1A] bg-black/20 p-3">
                    <p className="font-mono text-xs font-bold text-[#00D4AA]">{domain.label}</p>
                    <p className="mt-1 truncate text-[10px] text-[#CCCCCC]">{domain.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#FFFEF9] py-14 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8C3F48]">
                <PackageCheck className="mr-2 inline h-4 w-4" aria-hidden="true" />
                {copy.bundleTitle}
              </p>
              <h2 className="mt-4 font-serif text-3xl font-light text-[#2C2C2C] md:text-5xl">
                {copy.bundleIntro}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {copy.bundles.map((bundle) => (
                <Link
                  key={bundle.name}
                  href={bundle.href}
                  className="group flex min-h-48 flex-col justify-between border border-[#8C3F48]/15 bg-[#FAF7F2] p-5 transition-colors hover:border-[#8C3F48]/45"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[#2C2C2C]">{bundle.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#2C2C2C]/65">{bundle.text}</p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8C3F48]">
                    {copy.secondaryCta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0A0A0A] py-14 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00D4AA]">
                <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden="true" />
                {copy.retentionTitle}
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl font-light text-[#E8E8E8] md:text-5xl">
                {copy.retentionText}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Mail, label: 'Email' },
                { icon: ShieldCheck, label: 'Trust' },
                { icon: PackageCheck, label: 'Bundles' },
              ].map((item) => (
                <div key={item.label} className="border border-[#1A1A1A] bg-[#111111] p-5 text-center">
                  <item.icon className="mx-auto h-6 w-6 text-[#00D4AA]" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#E8E8E8]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

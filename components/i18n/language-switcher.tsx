'use client';

import { Globe2 } from 'lucide-react';
import { getLocaleUrl, localeNames, locales, type Locale } from '@/lib/i18n';

export function LanguageSwitcher({
  activeLocale,
  compact = false,
  onSelect,
}: {
  activeLocale?: Locale;
  compact?: boolean;
  onSelect?: () => void;
}) {
  const handleLocaleSelect = (locale: Locale) => {
    onSelect?.();

    if (typeof window === 'undefined') return;

    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    window.location.assign(isLocalHost ? `/${locale}` : getLocaleUrl(locale));
  };

  return (
    <nav aria-label="Language" className="flex items-center gap-2">
      <Globe2 className="h-4 w-4 text-[#8C3F48]" aria-hidden="true" />
      <div className="flex items-center gap-1">
        {locales.map((locale) => {
          const isActive = locale === activeLocale;

          return (
            <button
              key={locale}
              type="button"
              onClick={() => handleLocaleSelect(locale)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                isActive
                  ? 'border-[#8C3F48] bg-[#8C3F48] text-white'
                  : 'border-[#8C3F48]/20 text-[#2C2C2C]/70 hover:border-[#8C3F48]/50 hover:text-[#8C3F48]'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Switch language to ${localeNames[locale]}`}
              title={localeNames[locale]}
            >
              {compact ? locale : localeNames[locale]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

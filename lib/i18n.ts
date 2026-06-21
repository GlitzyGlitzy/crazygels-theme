export const defaultLocale = 'en';

export const locales = ['en', 'de', 'fr'] as const;

export type Locale = (typeof locales)[number];

export const localeSet = new Set<string>(locales);

export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
};

export const localeDomains: Record<Locale, string> = {
  en: 'en.crazygels.com',
  de: 'de.crazygels.com',
  fr: 'fr.crazygels.com',
};

export function isLocale(value: string): value is Locale {
  return localeSet.has(value);
}

export function getLocaleUrl(locale: Locale) {
  return `https://${localeDomains[locale]}`;
}

export const localizedLandingCopy: Record<Locale, {
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  headline: string;
  accent: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  reassurance: string;
  promiseTitle: string;
  promises: Array<{ title: string; text: string }>;
  bundleTitle: string;
  bundleIntro: string;
  bundles: Array<{ name: string; text: string; href: string }>;
  retentionTitle: string;
  retentionText: string;
}> = {
  en: {
    metadataTitle: 'Crazy Gels | AI Beauty Routines in English',
    metadataDescription:
      'Shop Crazy Gels in English. Build a personalized beauty routine with AI recommendations, bundles, reviews, and Shopify checkout.',
    eyebrow: 'English Storefront',
    headline: 'Beauty routines matched to your goals',
    accent: 'and ready to buy.',
    description:
      'Start with a free consultation, choose a guided routine, and shop skincare, hair care, nail wraps, cosmetics, and beauty tools with confidence.',
    primaryCta: 'Build my free routine',
    secondaryCta: 'Shop all products',
    reassurance: 'Secure checkout, real reviews, and easy returns.',
    promiseTitle: 'A clearer way to shop beauty',
    promises: [
      { title: 'Personalized', text: 'AI helps match products to your skin, hair, and nail goals.' },
      { title: 'Bundle-ready', text: 'Starter routines and refill paths make the first order easier.' },
      { title: 'Measurable', text: 'Consult, signup, bundle, cart, and checkout events are ready for growth loops.' },
    ],
    bundleTitle: 'Start with a routine',
    bundleIntro: 'Choose a focused entry point, then expand the basket when the fit is right.',
    bundles: [
      { name: 'Glow Starter', text: 'Cleanser, serum, moisturizer', href: '/collections/skincare' },
      { name: 'Nail Reset Kit', text: 'Gel wraps, prep tools, aftercare', href: '/collections/gel-nail-wraps' },
      { name: 'Hair Repair Stack', text: 'Scalp care, mask, finish oil', href: '/collections/haircare' },
    ],
    retentionTitle: 'Built for repeat orders',
    retentionText:
      'Email capture, consultation data, and replenishment reminders create a retention loop beyond the first purchase.',
  },
  de: {
    metadataTitle: 'Crazy Gels | KI-Beauty-Routinen auf Deutsch',
    metadataDescription:
      'Crazy Gels auf Deutsch. Erstelle eine personalisierte Beauty-Routine mit KI-Empfehlungen, Bundles, Bewertungen und sicherem Shopify-Checkout.',
    eyebrow: 'Deutscher Storefront',
    headline: 'Beauty-Routinen passend zu deinen Zielen',
    accent: 'sofort kaufbereit.',
    description:
      'Starte mit einer kostenlosen Beratung, erhalte passende Empfehlungen und kaufe Hautpflege, Haarpflege, Nagelfolien, Kosmetik und Beauty-Tools mit mehr Sicherheit.',
    primaryCta: 'Kostenlose Routine starten',
    secondaryCta: 'Alle Produkte ansehen',
    reassurance: 'Sicherer Checkout, echte Bewertungen und einfache Rückgaben.',
    promiseTitle: 'Beauty-Shopping ohne Rätselraten',
    promises: [
      { title: 'Personalisiert', text: 'Die KI hilft, Produkte auf Haut-, Haar- und Nagelziele abzustimmen.' },
      { title: 'Bundle-ready', text: 'Starter-Routinen und Nachkauf-Pfade machen die erste Bestellung einfacher.' },
      { title: 'Messbar', text: 'Consult, Signup, Bundle, Warenkorb und Checkout sind als Growth-Events messbar.' },
    ],
    bundleTitle: 'Starte mit einer Routine',
    bundleIntro: 'Wähle einen klaren Einstieg und erweitere deinen Warenkorb, wenn die Empfehlung passt.',
    bundles: [
      { name: 'Glow Starter', text: 'Cleanser, Serum, Moisturizer', href: '/collections/skincare' },
      { name: 'Nail Reset Kit', text: 'Gel-Nagelfolien, Prep-Tools, Aftercare', href: '/collections/gel-nail-wraps' },
      { name: 'Hair Repair Stack', text: 'Scalp Care, Maske, Finish Oil', href: '/collections/haircare' },
    ],
    retentionTitle: 'Gemacht für Wiederkäufe',
    retentionText:
      'E-Mail-Capture, Beratungsdaten und Refill-Erinnerungen schaffen eine Retention-Loop nach dem ersten Kauf.',
  },
  fr: {
    metadataTitle: 'Crazy Gels | Routines beauté IA en français',
    metadataDescription:
      'Crazy Gels en français. Créez une routine beauté personnalisée avec recommandations IA, bundles, avis et paiement Shopify sécurisé.',
    eyebrow: 'Boutique française',
    headline: 'Des routines beauté adaptées à vos objectifs',
    accent: 'prêtes à acheter.',
    description:
      'Commencez par une consultation gratuite, recevez des recommandations guidées et achetez soins, cheveux, nail wraps, maquillage et outils beauté en confiance.',
    primaryCta: 'Créer ma routine gratuite',
    secondaryCta: 'Voir les produits',
    reassurance: 'Paiement sécurisé, avis réels et retours simples.',
    promiseTitle: 'Une façon plus claire d’acheter la beauté',
    promises: [
      { title: 'Personnalisé', text: 'L’IA aide à relier les produits à vos objectifs peau, cheveux et ongles.' },
      { title: 'Pensé en bundles', text: 'Les routines de départ et les recharges rendent le premier achat plus simple.' },
      { title: 'Mesurable', text: 'Consultation, inscription, bundle, panier et checkout sont prêts pour les boucles de croissance.' },
    ],
    bundleTitle: 'Commencez par une routine',
    bundleIntro: 'Choisissez une entrée claire, puis complétez votre panier quand la recommandation est juste.',
    bundles: [
      { name: 'Glow Starter', text: 'Nettoyant, sérum, crème hydratante', href: '/collections/skincare' },
      { name: 'Nail Reset Kit', text: 'Nail wraps gel, outils prep, aftercare', href: '/collections/gel-nail-wraps' },
      { name: 'Hair Repair Stack', text: 'Soin du cuir chevelu, masque, huile de finition', href: '/collections/haircare' },
    ],
    retentionTitle: 'Conçu pour les réachats',
    retentionText:
      'La capture email, les données de consultation et les rappels de replenishment créent une boucle de fidélisation après le premier achat.',
  },
};

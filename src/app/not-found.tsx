import Link from 'next/link';

import {
  getCachedDefaultLanguage,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';

export default async function NotFound() {
  let labels = {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has been moved.',
    backHome: 'Back to Home',
    browseProducts: 'Browse Products',
  };

  try {
    const defaultLanguage = await getCachedDefaultLanguage();
    const locale = defaultLanguage.code;
    const uiMap = await getCachedUiTranslationMap(locale, locale, [
      'error.404.title',
      'error.404.description',
      'error.backHome',
      'error.browseProducts',
    ]);
    labels = {
      title: uiMap['error.404.title'] ?? labels.title,
      description: uiMap['error.404.description'] ?? labels.description,
      backHome: uiMap['error.backHome'] ?? labels.backHome,
      browseProducts: uiMap['error.browseProducts'] ?? labels.browseProducts,
    };
  } catch {
    /* DB unavailable — use English fallbacks */
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-8xl font-bold text-primary/20">404</p>
        <h1 className="mt-4 text-2xl font-bold">{labels.title}</h1>
        <p className="mt-2 text-muted-foreground">{labels.description}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {labels.backHome}
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            {labels.browseProducts}
          </Link>
        </div>
      </div>
    </div>
  );
}

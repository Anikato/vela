import { desc, eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { news, newsTranslations, languages } from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';

function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportNewsCsv(defaultLocale: string): Promise<string> {
  const storage = getStorageAdapter();

  const allLangs = await db
    .select()
    .from(languages)
    .where(eq(languages.isActive, true))
    .orderBy(languages.sortOrder);

  const locales = allLangs.map((l) => l.code);

  const rows = await db.query.news.findMany({
    with: {
      coverImage: true,
      translations: true,
    },
    orderBy: [desc(news.createdAt)],
  });

  const headers = [
    'id',
    'slug',
    'status',
    'published_at',
    'cover_image_url',
    'created_at',
    ...locales.flatMap((locale) => [
      `title_${locale}`,
      `summary_${locale}`,
      `seo_title_${locale}`,
      `seo_description_${locale}`,
    ]),
  ];

  const csvRows = rows.map((row) => {
    const base = [
      escapeCsv(row.id),
      escapeCsv(row.slug),
      escapeCsv(row.status),
      escapeCsv(row.publishedAt?.toISOString() ?? ''),
      escapeCsv(row.coverImage ? storage.getPublicUrl(row.coverImage.filename) : ''),
      escapeCsv(row.createdAt.toISOString()),
    ];

    const i18nCols = locales.flatMap((locale) => {
      const t = row.translations.find((tr) => tr.locale === locale);
      return [
        escapeCsv(t?.title),
        escapeCsv(t?.summary),
        escapeCsv(t?.seoTitle),
        escapeCsv(t?.seoDescription),
      ];
    });

    return [...base, ...i18nCols].join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
}

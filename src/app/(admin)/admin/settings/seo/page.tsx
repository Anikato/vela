import { eq } from 'drizzle-orm';

import { db } from '@/server/db';
import { languages } from '@/server/db/schema';
import { getSeoOverview } from '@/server/services/seo-overview.service';
import { SeoOverviewPage } from '@/components/admin/settings/seo-overview-page';

export default async function SeoRoute() {
  const defaultLang = await db.query.languages.findFirst({
    where: eq(languages.isDefault, true),
  });
  const defaultLocale = defaultLang?.code ?? 'en-US';

  const data = await getSeoOverview(defaultLocale);
  return <SeoOverviewPage data={data} />;
}

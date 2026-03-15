export const metadata = { title: '重定向' };

import { getRedirectList } from '@/server/services/redirect.service';
import { RedirectManagement } from '@/components/admin/redirects/redirect-management';

export default async function RedirectsPage() {
  const redirects = await getRedirectList();
  return <RedirectManagement initialRedirects={redirects} />;
}

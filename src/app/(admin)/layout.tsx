import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/layout';
import { Toaster } from '@/components/ui/sonner';
import { getSiteName } from '@/server/services/settings-public.service';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName();
  return {
    title: {
      template: `%s — ${siteName} 管理后台`,
      default: `${siteName} 管理后台`,
    },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteName = await getSiteName();
  return (
    <>
      <AdminShell siteName={siteName}>{children}</AdminShell>
      <Toaster richColors />
    </>
  );
}

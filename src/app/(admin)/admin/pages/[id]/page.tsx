import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PageIdRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/pages/${id}/sections`);
}

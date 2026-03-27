import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryIdRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/categories/${id}/sections`);
}

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string; sectionId: string }>;
}

export default async function CategorySectionItemsRedirect({ params }: PageProps) {
  const { id, sectionId } = await params;
  redirect(`/admin/categories/${id}/sections/${sectionId}/edit`);
}

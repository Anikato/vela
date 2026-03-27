import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string; sectionId: string }>;
}

export default async function SectionIdRedirect({ params }: PageProps) {
  const { id, sectionId } = await params;
  redirect(`/admin/pages/${id}/sections/${sectionId}/edit`);
}

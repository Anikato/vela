import { MediaManagement, type MediaItem } from '@/components/admin/media/media-management';
import { listMedia } from '@/server/services/media.service';

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
  }>;
}

export default async function MediaPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const search = params.search ?? '';
  const typeFilter = (['image', 'document'].includes(params.type ?? '')
    ? params.type
    : 'all') as 'all' | 'image' | 'document';

  const media = await listMedia({ page, pageSize: 30, search, typeFilter });
  const initialItems: MediaItem[] = media.items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">媒体库</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            上传、管理和复用网站所需的图片和文档资源
          </p>
        </div>
      </div>
      <MediaManagement
        initialItems={initialItems}
        initialTotal={media.total}
        initialPage={media.page}
        initialTotalPages={media.totalPages}
      />
    </div>
  );
}

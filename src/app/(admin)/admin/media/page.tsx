import { MediaManagement, type MediaItem } from '@/components/admin/media/media-management';
import { listMedia } from '@/server/services/media.service';

/**
 * 媒体库页面
 * Server Component 直接调用 Service（读取场景）
 */
export default async function MediaPage() {
  const media = await listMedia({ page: 1, pageSize: 100 });
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
            上传、管理和复用网站所需的图片资源
          </p>
        </div>
      </div>
      <MediaManagement initialItems={initialItems} />
    </div>
  );
}

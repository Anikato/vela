import path from 'node:path';

import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import sharp from 'sharp';

import { UPLOAD_LIMITS } from '@/lib/constants';
import { NotFoundError } from '@/lib/errors';
import { db } from '@/server/db';
import { media } from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';

export { ensureMimeTypeAllowed, ensureFileSizeAllowed, buildBaseDir } from './media.utils';
import { ensureMimeTypeAllowed, ensureFileSizeAllowed, buildBaseDir } from './media.utils';

export type Media = typeof media.$inferSelect;

const IMAGE_VARIANTS = [
  { key: 'thumbnail', width: UPLOAD_LIMITS.IMAGE_SIZES.thumbnail },
  { key: 'small', width: UPLOAD_LIMITS.IMAGE_SIZES.small },
  { key: 'medium', width: UPLOAD_LIMITS.IMAGE_SIZES.medium },
  { key: 'large', width: UPLOAD_LIMITS.IMAGE_SIZES.large },
] as const;

interface UploadMediaInput {
  fileBuffer: Buffer;
  originalName: string;
  mimeType: string;
  alt?: string | null;
}

export interface UploadMediaResult extends Media {
  url: string;
  variants?: Record<string, string>;
}

export interface ListMediaParams {
  page?: number;
  pageSize?: number;
  search?: string;
  typeFilter?: 'image' | 'document' | 'all';
}


async function processRasterImage(
  fileBuffer: Buffer,
  baseDir: string,
): Promise<{
  originalPath: string;
  originalBuffer: Buffer;
  width: number | null;
  height: number | null;
  variants: Array<{ key: string; path: string; buffer: Buffer }>;
}> {
  const originalPath = path.posix.join(baseDir, 'original.webp');
  const originalBuffer = await sharp(fileBuffer)
    .rotate()
    .webp({ quality: 88 })
    .toBuffer();

  const metadata = await sharp(originalBuffer).metadata();
  const variants = await Promise.all(
    IMAGE_VARIANTS.map(async (variant) => {
      const variantPath = path.posix.join(baseDir, `${variant.key}.webp`);
      const variantBuffer = await sharp(originalBuffer)
        .resize({
          width: variant.width,
          withoutEnlargement: true,
        })
        .webp({ quality: 84 })
        .toBuffer();

      return {
        key: variant.key,
        path: variantPath,
        buffer: variantBuffer,
      };
    }),
  );

  return {
    originalPath,
    originalBuffer,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    variants,
  };
}

async function processStaticImage(
  fileBuffer: Buffer,
  originalName: string,
  baseDir: string,
): Promise<{
  originalPath: string;
  originalBuffer: Buffer;
}> {
  const ext = path.extname(originalName).toLowerCase() || '.bin';
  const originalPath = path.posix.join(baseDir, `original${ext}`);
  return { originalPath, originalBuffer: fileBuffer };
}

/**
 * 上传媒体文件并写入 media 表。
 * 支持图片与常见文档类型（pdf/doc/docx/xls/xlsx/txt）。
 */
export async function uploadMedia(input: UploadMediaInput): Promise<UploadMediaResult> {
  ensureMimeTypeAllowed(input.mimeType);
  ensureFileSizeAllowed(input.fileBuffer.length);

  const storage = getStorageAdapter();
  const baseDir = buildBaseDir();
  const isRaster = ['image/jpeg', 'image/png', 'image/webp'].includes(input.mimeType);

  const uploadedPaths: string[] = [];

  try {
    if (isRaster) {
      const processed = await processRasterImage(input.fileBuffer, baseDir);

      await storage.uploadObject({
        path: processed.originalPath,
        buffer: processed.originalBuffer,
      });
      uploadedPaths.push(processed.originalPath);

      const variantMap: Record<string, string> = {};

      for (const variant of processed.variants) {
        await storage.uploadObject({ path: variant.path, buffer: variant.buffer });
        uploadedPaths.push(variant.path);
        variantMap[variant.key] = storage.getPublicUrl(variant.path);
      }

      const [created] = await db
        .insert(media)
        .values({
          filename: processed.originalPath,
          originalName: input.originalName,
          mimeType: 'image/webp',
          size: processed.originalBuffer.length,
          width: processed.width,
          height: processed.height,
          alt: input.alt?.trim() || null,
        })
        .returning();

      return {
        ...created,
        url: storage.getPublicUrl(created.filename),
        variants: variantMap,
      };
    }

    const processed = await processStaticImage(input.fileBuffer, input.originalName, baseDir);
    await storage.uploadObject({
      path: processed.originalPath,
      buffer: processed.originalBuffer,
    });
    uploadedPaths.push(processed.originalPath);

    const [created] = await db
      .insert(media)
      .values({
        filename: processed.originalPath,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: processed.originalBuffer.length,
        width: null,
        height: null,
        alt: input.alt?.trim() || null,
      })
      .returning();

    return {
      ...created,
      url: storage.getPublicUrl(created.filename),
    };
  } catch (error) {
    await Promise.all(uploadedPaths.map((uploadedPath) => storage.deleteObject(uploadedPath)));
    throw error;
  }
}

/**
 * 分页获取媒体列表（按创建时间倒序），支持搜索和类型筛选。
 */
export async function listMedia(params: ListMediaParams = {}): Promise<{
  items: Array<Media & { url: string }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const storage = getStorageAdapter();

  const conditions = [];
  if (params.search?.trim()) {
    const pattern = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(media.originalName, pattern),
        ilike(media.alt, pattern),
      ),
    );
  }
  if (params.typeFilter === 'image') {
    conditions.push(sql`${media.mimeType} like 'image/%'`);
  } else if (params.typeFilter === 'document') {
    conditions.push(sql`${media.mimeType} not like 'image/%'`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total: totalCount }] = await db
    .select({ total: count() })
    .from(media)
    .where(whereClause);

  const total = Number(totalCount);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  const rows = await db
    .select()
    .from(media)
    .where(whereClause)
    .orderBy(desc(media.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map((row) => ({ ...row, url: storage.getPublicUrl(row.filename) })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * 更新媒体文件的 ALT 文本。
 */
export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  const [target] = await db.select().from(media).where(eq(media.id, id));
  if (!target) throw new NotFoundError('Media', id);
  await db.update(media).set({ alt: alt.trim() || null }).where(eq(media.id, id));
}

/**
 * 删除媒体文件及数据库记录。
 */
export async function deleteMediaById(id: string): Promise<void> {
  const [target] = await db.select().from(media).where(eq(media.id, id));
  if (!target) {
    throw new NotFoundError('Media', id);
  }

  const storage = getStorageAdapter();
  const parentDir = path.posix.dirname(target.filename);
  const possibleFiles = [
    target.filename,
    ...IMAGE_VARIANTS.map((variant) => path.posix.join(parentDir, `${variant.key}.webp`)),
  ];

  await Promise.all(possibleFiles.map((objectPath) => storage.deleteObject(objectPath)));
  await db.delete(media).where(and(eq(media.id, id)));
}

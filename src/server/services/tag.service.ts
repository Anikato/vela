import { and, asc, desc, eq } from 'drizzle-orm';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { tagTranslations, tags } from '@/server/db/schema';

export type Tag = typeof tags.$inferSelect;
export type TagTranslation = typeof tagTranslations.$inferSelect;

export interface TagWithTranslations extends Tag {
  translations: TagTranslation[];
}

export interface TagListItem extends TagWithTranslations {
  displayName: string;
}

export interface TagTranslationInput {
  locale: string;
  name?: string;
}

export interface CreateTagInput {
  slug: string;
  translations: TagTranslationInput[];
}

export type UpdateTagInput = Partial<CreateTagInput>;

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function ensureTranslationHasName(translations: TagTranslationInput[]): void {
  const hasName = translations.some((item) => Boolean(item.name?.trim()));
  if (!hasName) {
    throw new ValidationError('At least one translation name is required');
  }
}

async function upsertTagTranslations(
  tagId: string,
  translationsInput: TagTranslationInput[],
): Promise<void> {
  for (const translation of translationsInput) {
    const locale = translation.locale.trim();
    if (!locale) continue;

    const values = {
      name: translation.name?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(tagTranslations)
      .where(
        and(eq(tagTranslations.tagId, tagId), eq(tagTranslations.locale, locale)),
      );

    if (existing) {
      await db
        .update(tagTranslations)
        .set(values)
        .where(eq(tagTranslations.id, existing.id));
      continue;
    }

    await db.insert(tagTranslations).values({
      tagId,
      locale,
      ...values,
    });
  }
}

export async function getAllTagsWithTranslations(): Promise<TagWithTranslations[]> {
  return db.query.tags.findMany({
    with: {
      translations: true,
    },
    orderBy: [desc(tags.createdAt), asc(tags.slug)],
  });
}

export async function getTagById(id: string): Promise<TagWithTranslations> {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.id, id),
    with: { translations: true },
  });

  if (!tag) {
    throw new NotFoundError('Tag', id);
  }

  return tag;
}

export async function getTagList(locale: string, defaultLocale: string): Promise<TagListItem[]> {
  const rows = await getAllTagsWithTranslations();
  return rows.map((item) => {
    const display = getTranslation(item.translations, locale, defaultLocale);
    return {
      ...item,
      displayName: display?.name ?? '(未命名)',
    };
  });
}

export async function createTag(input: CreateTagInput): Promise<TagWithTranslations> {
  const slug = normalizeSlug(input.slug);
  if (!slug) {
    throw new ValidationError('Slug is required');
  }

  ensureTranslationHasName(input.translations);

  const [existing] = await db.select().from(tags).where(eq(tags.slug, slug));
  if (existing) {
    throw new DuplicateError('Tag', 'slug', slug);
  }

  const [created] = await db
    .insert(tags)
    .values({
      slug,
    })
    .returning();

  await upsertTagTranslations(created.id, input.translations);
  return getTagById(created.id);
}

export async function updateTag(id: string, input: UpdateTagInput): Promise<TagWithTranslations> {
  const existing = await getTagById(id);

  if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug);
    if (!slug) {
      throw new ValidationError('Slug is required');
    }
    const [duplicate] = await db.select().from(tags).where(eq(tags.slug, slug));
    if (duplicate && duplicate.id !== id) {
      throw new DuplicateError('Tag', 'slug', slug);
    }
    input.slug = slug;
  }

  await db
    .update(tags)
    .set({
      slug: input.slug ?? existing.slug,
    })
    .where(eq(tags.id, id));

  if (input.translations) {
    ensureTranslationHasName(input.translations);
    await upsertTagTranslations(id, input.translations);
  }

  return getTagById(id);
}

export async function deleteTag(id: string): Promise<void> {
  await getTagById(id);
  await db.delete(tags).where(eq(tags.id, id));
}

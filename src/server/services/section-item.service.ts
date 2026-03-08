import { and, asc, eq } from 'drizzle-orm';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import {
  sections,
  sectionItems,
  sectionItemTranslations,
  media,
} from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';

// ─── Types ───

export type SectionItem = typeof sectionItems.$inferSelect;
export type SectionItemTranslation = typeof sectionItemTranslations.$inferSelect;

export interface SectionItemWithTranslations extends SectionItem {
  translations: SectionItemTranslation[];
  imageUrl: string | null;
}

export interface SectionItemListItem extends SectionItemWithTranslations {
  displayTitle: string;
}

export interface SectionItemTranslationInput {
  locale: string;
  title?: string;
  description?: string;
  content?: string;
}

export interface CreateSectionItemInput {
  sectionId: string;
  iconName?: string | null;
  imageId?: string | null;
  linkUrl?: string | null;
  config?: Record<string, unknown>;
  sortOrder?: number;
  translations: SectionItemTranslationInput[];
}

export interface UpdateSectionItemInput {
  iconName?: string | null;
  imageId?: string | null;
  linkUrl?: string | null;
  config?: Record<string, unknown>;
  sortOrder?: number;
  translations?: SectionItemTranslationInput[];
}

// ─── Helpers ───

async function ensureSectionExists(sectionId: string): Promise<void> {
  const [section] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.id, sectionId));
  if (!section) {
    throw new NotFoundError('Section', sectionId);
  }
}

function resolveImageUrl(imageRow: { filename: string } | null): string | null {
  if (!imageRow) return null;
  const storage = getStorageAdapter();
  return storage.getPublicUrl(imageRow.filename);
}

async function upsertItemTranslations(
  itemId: string,
  translationsInput: SectionItemTranslationInput[],
): Promise<void> {
  for (const translation of translationsInput) {
    const locale = translation.locale.trim();
    if (!locale) continue;

    const values = {
      title: translation.title?.trim() || null,
      description: translation.description?.trim() || null,
      content: translation.content?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(sectionItemTranslations)
      .where(
        and(
          eq(sectionItemTranslations.itemId, itemId),
          eq(sectionItemTranslations.locale, locale),
        ),
      );

    if (existing) {
      await db
        .update(sectionItemTranslations)
        .set(values)
        .where(eq(sectionItemTranslations.id, existing.id));
      continue;
    }

    await db.insert(sectionItemTranslations).values({
      itemId,
      locale,
      ...values,
    });
  }
}

// ─── CRUD ───

export async function getSectionItems(
  sectionId: string,
  locale: string,
  defaultLocale: string,
): Promise<SectionItemListItem[]> {
  await ensureSectionExists(sectionId);

  const rows = await db.query.sectionItems.findMany({
    where: eq(sectionItems.sectionId, sectionId),
    with: {
      translations: true,
      image: true,
    },
    orderBy: [asc(sectionItems.sortOrder), asc(sectionItems.createdAt)],
  });

  return rows.map((item) => {
    const display = getTranslation(item.translations, locale, defaultLocale);
    return {
      ...item,
      imageUrl: resolveImageUrl(item.image),
      displayTitle: display?.title ?? `(子项 ${item.sortOrder})`,
    };
  });
}

export async function getSectionItemById(
  id: string,
): Promise<SectionItemWithTranslations> {
  const item = await db.query.sectionItems.findFirst({
    where: eq(sectionItems.id, id),
    with: { translations: true, image: true },
  });

  if (!item) {
    throw new NotFoundError('SectionItem', id);
  }

  return {
    ...item,
    imageUrl: resolveImageUrl(item.image),
  };
}

export async function createSectionItem(
  input: CreateSectionItemInput,
): Promise<SectionItemWithTranslations> {
  await ensureSectionExists(input.sectionId);

  let nextSortOrder = input.sortOrder;
  if (nextSortOrder === undefined) {
    const existing = await db
      .select({ id: sectionItems.id })
      .from(sectionItems)
      .where(eq(sectionItems.sectionId, input.sectionId));
    nextSortOrder = existing.length;
  }

  const [created] = await db
    .insert(sectionItems)
    .values({
      sectionId: input.sectionId,
      iconName: input.iconName?.trim() || null,
      imageId: input.imageId || null,
      linkUrl: input.linkUrl?.trim() || null,
      config: input.config ?? {},
      sortOrder: nextSortOrder,
    })
    .returning();

  await upsertItemTranslations(created.id, input.translations);
  return getSectionItemById(created.id);
}

export async function updateSectionItem(
  id: string,
  input: UpdateSectionItemInput,
): Promise<SectionItemWithTranslations> {
  const existing = await getSectionItemById(id);

  await db
    .update(sectionItems)
    .set({
      iconName:
        input.iconName === undefined
          ? existing.iconName
          : input.iconName?.trim() || null,
      imageId:
        input.imageId === undefined ? existing.imageId : input.imageId || null,
      linkUrl:
        input.linkUrl === undefined
          ? existing.linkUrl
          : input.linkUrl?.trim() || null,
      config: input.config ?? existing.config,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(sectionItems.id, id));

  if (input.translations) {
    await upsertItemTranslations(id, input.translations);
  }

  return getSectionItemById(id);
}

export async function deleteSectionItem(id: string): Promise<void> {
  const existing = await getSectionItemById(id);

  await db.delete(sectionItems).where(eq(sectionItems.id, id));

  // Re-order remaining siblings
  const siblings = await db
    .select({ id: sectionItems.id })
    .from(sectionItems)
    .where(eq(sectionItems.sectionId, existing.sectionId))
    .orderBy(asc(sectionItems.sortOrder), asc(sectionItems.createdAt));

  for (let index = 0; index < siblings.length; index++) {
    await db
      .update(sectionItems)
      .set({ sortOrder: index, updatedAt: new Date() })
      .where(eq(sectionItems.id, siblings[index].id));
  }
}

export async function reorderSectionItems(
  sectionId: string,
  orderedItemIds: string[],
): Promise<void> {
  await ensureSectionExists(sectionId);

  if (orderedItemIds.length === 0) return;

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedItemIds.length; index++) {
      await tx
        .update(sectionItems)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(sectionItems.id, orderedItemIds[index]));
    }
  });
}

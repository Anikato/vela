import { and, asc, eq } from 'drizzle-orm';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { categories, categoryTranslations, languages } from '@/server/db/schema';

export type Category = typeof categories.$inferSelect;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;

export interface CategoryWithTranslations extends Category {
  translations: CategoryTranslation[];
}

export interface CategoryListItem extends CategoryWithTranslations {
  displayName: string;
  parentDisplayName: string | null;
}

export interface CategoryTranslationInput {
  locale: string;
  name?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreateCategoryInput {
  slug: string;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  translations: CategoryTranslationInput[];
}

export type UpdateCategoryInput = Partial<
  Omit<CreateCategoryInput, 'translations'>
> & {
  translations?: CategoryTranslationInput[];
};

export interface ReorderCategoryItemInput {
  id: string;
  parentId: string | null;
  sortOrder: number;
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function ensureTranslationHasName(translations: CategoryTranslationInput[]): void {
  const hasName = translations.some((item) => Boolean(item.name?.trim()));
  if (!hasName) {
    throw new ValidationError('At least one translation name is required');
  }
}

async function upsertCategoryTranslations(
  categoryId: string,
  translationsInput: CategoryTranslationInput[],
): Promise<void> {
  for (const translation of translationsInput) {
    const locale = translation.locale.trim();
    if (!locale) continue;

    const values = {
      name: translation.name?.trim() || null,
      description: translation.description?.trim() || null,
      seoTitle: translation.seoTitle?.trim() || null,
      seoDescription: translation.seoDescription?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.categoryId, categoryId),
          eq(categoryTranslations.locale, locale),
        ),
      );

    if (existing) {
      await db
        .update(categoryTranslations)
        .set(values)
        .where(eq(categoryTranslations.id, existing.id));
      continue;
    }

    await db.insert(categoryTranslations).values({
      categoryId,
      locale,
      ...values,
    });
  }
}

export async function getAllCategoriesWithTranslations(): Promise<CategoryWithTranslations[]> {
  return db.query.categories.findMany({
    with: {
      translations: true,
    },
    orderBy: [asc(categories.sortOrder), asc(categories.createdAt)],
  });
}

export async function getCategoryById(id: string): Promise<CategoryWithTranslations> {
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: { translations: true },
  });

  if (!category) {
    throw new NotFoundError('Category', id);
  }

  return category;
}

export async function getCategoryList(locale: string, defaultLocale: string): Promise<CategoryListItem[]> {
  const rows = await getAllCategoriesWithTranslations();
  const map = new Map(rows.map((item) => [item.id, item]));

  return rows.map((item) => {
    const display = getTranslation(item.translations, locale, defaultLocale);
    const parent = item.parentId ? map.get(item.parentId) : null;
    const parentDisplay = parent
      ? getTranslation(parent.translations, locale, defaultLocale)
      : undefined;

    return {
      ...item,
      displayName: display?.name ?? '(未命名)',
      parentDisplayName: parentDisplay?.name ?? null,
    };
  });
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryWithTranslations> {
  const slug = normalizeSlug(input.slug);
  if (!slug) {
    throw new ValidationError('Slug is required');
  }

  ensureTranslationHasName(input.translations);

  const [existing] = await db.select().from(categories).where(eq(categories.slug, slug));
  if (existing) {
    throw new DuplicateError('Category', 'slug', slug);
  }

  if (input.parentId) {
    const [parent] = await db.select().from(categories).where(eq(categories.id, input.parentId));
    if (!parent) {
      throw new ValidationError('Parent category not found');
    }
  }

  if (input.sortOrder === undefined) {
    const all = await db.select().from(categories);
    input.sortOrder = all.length;
  }

  const [created] = await db
    .insert(categories)
    .values({
      slug,
      parentId: input.parentId ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder,
    })
    .returning();

  await upsertCategoryTranslations(created.id, input.translations);
  return getCategoryById(created.id);
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryWithTranslations> {
  const existing = await getCategoryById(id);

  if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug);
    if (!slug) {
      throw new ValidationError('Slug is required');
    }
    const [duplicate] = await db.select().from(categories).where(eq(categories.slug, slug));
    if (duplicate && duplicate.id !== id) {
      throw new DuplicateError('Category', 'slug', slug);
    }
    input.slug = slug;
  }

  if (input.parentId === id) {
    throw new ValidationError('Category cannot set itself as parent');
  }

  if (input.parentId) {
    const [parent] = await db.select().from(categories).where(eq(categories.id, input.parentId));
    if (!parent) {
      throw new ValidationError('Parent category not found');
    }
  }

  await db
    .update(categories)
    .set({
      slug: input.slug ?? existing.slug,
      parentId: input.parentId === undefined ? existing.parentId : input.parentId,
      isActive: input.isActive ?? existing.isActive,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id));

  if (input.translations) {
    ensureTranslationHasName(input.translations);
    await upsertCategoryTranslations(id, input.translations);
  }

  return getCategoryById(id);
}

export async function deleteCategory(id: string): Promise<void> {
  await getCategoryById(id);

  const [child] = await db.select().from(categories).where(eq(categories.parentId, id));
  if (child) {
    throw new ValidationError('Please delete child categories first');
  }

  await db.delete(categories).where(eq(categories.id, id));
}

export async function reorderCategoryTree(items: ReorderCategoryItemInput[]): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const idSet = new Set<string>();
  for (const item of items) {
    if (idSet.has(item.id)) {
      throw new ValidationError(`Duplicate category id in reorder payload: ${item.id}`);
    }
    idSet.add(item.id);

    if (item.parentId === item.id) {
      throw new ValidationError('Category cannot set itself as parent');
    }

    if (item.parentId && !idSet.has(item.parentId)) {
      // parent can appear after child in payload, delay full check below
      continue;
    }
  }

  const all = await db.select({ id: categories.id }).from(categories);
  const allIds = new Set(all.map((row) => row.id));
  for (const item of items) {
    if (!allIds.has(item.id)) {
      throw new ValidationError(`Category not found: ${item.id}`);
    }
    if (item.parentId && !allIds.has(item.parentId)) {
      throw new ValidationError(`Parent category not found: ${item.parentId}`);
    }
  }

  const parentMap = new Map(items.map((item) => [item.id, item.parentId]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function detectCycle(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new ValidationError('Category tree has circular parent references');
    }

    visiting.add(id);
    const parentId = parentMap.get(id);
    if (parentId && parentMap.has(parentId)) {
      detectCycle(parentId);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const item of items) {
    detectCycle(item.id);
  }

  await db.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .update(categories)
        .set({
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, item.id));
    }
  });
}

export async function getAllLocales(): Promise<string[]> {
  const rows = await db
    .select({ code: languages.code })
    .from(languages)
    .where(eq(languages.isActive, true))
    .orderBy(asc(languages.sortOrder), asc(languages.code));

  return rows.map((item) => item.code);
}

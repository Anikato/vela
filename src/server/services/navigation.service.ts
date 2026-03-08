import { and, asc, eq, isNull } from 'drizzle-orm';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { buildLocalizedPath, getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { navigationItemTranslations, navigationItems } from '@/server/db/schema';

export type NavigationItem = typeof navigationItems.$inferSelect;
export type NavigationItemTranslation = typeof navigationItemTranslations.$inferSelect;

export type NavigationType = 'internal' | 'external' | 'category' | 'page';

export interface NavigationWithTranslations extends NavigationItem {
  translations: NavigationItemTranslation[];
}

export interface NavigationListItem extends NavigationWithTranslations {
  displayLabel: string;
  parentDisplayLabel: string | null;
}

export interface WebsiteNavigationNode {
  id: string;
  label: string;
  href: string | null;
  type: NavigationType;
  openNewTab: boolean;
  children: WebsiteNavigationNode[];
}

export interface NavigationTranslationInput {
  locale: string;
  label?: string;
}

export interface CreateNavigationInput {
  parentId?: string | null;
  type: NavigationType;
  url?: string | null;
  categoryId?: string | null;
  pageId?: string | null;
  showChildren?: boolean;
  icon?: string | null;
  openNewTab?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  translations: NavigationTranslationInput[];
}

export type UpdateNavigationInput = Partial<Omit<CreateNavigationInput, 'translations'>> & {
  translations?: NavigationTranslationInput[];
};

function ensureTranslationHasLabel(translations: NavigationTranslationInput[]): void {
  const hasLabel = translations.some((item) => Boolean(item.label?.trim()));
  if (!hasLabel) {
    throw new ValidationError('At least one translation label is required');
  }
}

function ensureNavigationTypeConstraint(input: {
  type: NavigationType;
  url?: string | null;
  categoryId?: string | null;
  pageId?: string | null;
}): void {
  if (input.type === 'internal' || input.type === 'external') {
    if (!input.url?.trim()) {
      throw new ValidationError('URL is required for internal/external link');
    }
    return;
  }

  if (input.type === 'category') {
    if (!input.categoryId) {
      throw new ValidationError('categoryId is required for category link');
    }
    return;
  }

  if (input.type === 'page') {
    if (!input.pageId) {
      throw new ValidationError('pageId is required for page link');
    }
  }
}

async function upsertNavigationTranslations(
  itemId: string,
  translationsInput: NavigationTranslationInput[],
): Promise<void> {
  for (const translation of translationsInput) {
    const locale = translation.locale.trim();
    if (!locale) continue;

    const values = {
      label: translation.label?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(navigationItemTranslations)
      .where(
        and(
          eq(navigationItemTranslations.itemId, itemId),
          eq(navigationItemTranslations.locale, locale),
        ),
      );

    if (existing) {
      await db
        .update(navigationItemTranslations)
        .set(values)
        .where(eq(navigationItemTranslations.id, existing.id));
      continue;
    }

    await db.insert(navigationItemTranslations).values({
      itemId,
      locale,
      ...values,
    });
  }
}

async function ensureParentExists(parentId: string): Promise<void> {
  const [parent] = await db
    .select({ id: navigationItems.id })
    .from(navigationItems)
    .where(eq(navigationItems.id, parentId));

  if (!parent) {
    throw new ValidationError('Parent navigation item not found');
  }
}

async function ensureNoCycle(itemId: string, parentId: string | null): Promise<void> {
  if (!parentId) return;
  if (itemId === parentId) {
    throw new ValidationError('Navigation item cannot set itself as parent');
  }

  const allItems = await db
    .select({ id: navigationItems.id, parentId: navigationItems.parentId })
    .from(navigationItems);
  const map = new Map(allItems.map((item) => [item.id, item.parentId]));

  let cursor: string | null = parentId;
  while (cursor) {
    if (cursor === itemId) {
      throw new ValidationError('Navigation tree has circular parent references');
    }
    cursor = map.get(cursor) ?? null;
  }
}

export async function getAllNavigationWithTranslations(): Promise<NavigationWithTranslations[]> {
  return db.query.navigationItems.findMany({
    with: {
      translations: true,
    },
    orderBy: [asc(navigationItems.sortOrder), asc(navigationItems.createdAt)],
  });
}

export async function getNavigationById(id: string): Promise<NavigationWithTranslations> {
  const item = await db.query.navigationItems.findFirst({
    where: eq(navigationItems.id, id),
    with: {
      translations: true,
    },
  });

  if (!item) {
    throw new NotFoundError('NavigationItem', id);
  }

  return item;
}

export async function getNavigationList(
  locale: string,
  defaultLocale: string,
): Promise<NavigationListItem[]> {
  const rows = await getAllNavigationWithTranslations();
  const map = new Map(rows.map((item) => [item.id, item]));

  return rows.map((item) => {
    const display = getTranslation(item.translations, locale, defaultLocale);
    const parent = item.parentId ? map.get(item.parentId) : null;
    const parentDisplay = parent
      ? getTranslation(parent.translations, locale, defaultLocale)
      : undefined;

    return {
      ...item,
      displayLabel: display?.label ?? '(未命名)',
      parentDisplayLabel: parentDisplay?.label ?? null,
    };
  });
}

export async function createNavigationItem(
  input: CreateNavigationInput,
): Promise<NavigationWithTranslations> {
  ensureTranslationHasLabel(input.translations);
  ensureNavigationTypeConstraint(input);

  if (input.parentId) {
    await ensureParentExists(input.parentId);
  }

  let nextSortOrder = input.sortOrder;
  if (nextSortOrder === undefined) {
    const siblings = await db
      .select({ id: navigationItems.id })
      .from(navigationItems)
      .where(
        input.parentId
          ? eq(navigationItems.parentId, input.parentId)
          : isNull(navigationItems.parentId),
      );
    nextSortOrder = siblings.length;
  }

  const [created] = await db
    .insert(navigationItems)
    .values({
      parentId: input.parentId ?? null,
      type: input.type,
      url: input.url?.trim() || null,
      categoryId: input.categoryId ?? null,
      pageId: input.pageId ?? null,
      showChildren: input.showChildren ?? false,
      icon: input.icon?.trim() || null,
      openNewTab: input.openNewTab ?? false,
      sortOrder: nextSortOrder,
      isActive: input.isActive ?? true,
    })
    .returning();

  await upsertNavigationTranslations(created.id, input.translations);
  return getNavigationById(created.id);
}

export async function updateNavigationItem(
  id: string,
  input: UpdateNavigationInput,
): Promise<NavigationWithTranslations> {
  const existing = await getNavigationById(id);

  const nextType = input.type ?? (existing.type as NavigationType);
  const normalizedInput = {
    type: nextType,
    url: input.url === undefined ? existing.url : input.url,
    categoryId: input.categoryId === undefined ? existing.categoryId : input.categoryId,
    pageId: input.pageId === undefined ? existing.pageId : input.pageId,
  };
  ensureNavigationTypeConstraint(normalizedInput);

  const nextParentId = input.parentId === undefined ? existing.parentId : input.parentId;
  if (nextParentId) {
    await ensureParentExists(nextParentId);
  }
  await ensureNoCycle(id, nextParentId ?? null);

  await db
    .update(navigationItems)
    .set({
      parentId: nextParentId ?? null,
      type: nextType,
      url: normalizedInput.url?.trim() || null,
      categoryId: normalizedInput.categoryId ?? null,
      pageId: normalizedInput.pageId ?? null,
      showChildren: input.showChildren ?? existing.showChildren,
      icon: input.icon === undefined ? existing.icon : input.icon?.trim() || null,
      openNewTab: input.openNewTab ?? existing.openNewTab,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(navigationItems.id, id));

  if (input.translations) {
    ensureTranslationHasLabel(input.translations);
    await upsertNavigationTranslations(id, input.translations);
  }

  return getNavigationById(id);
}

export async function deleteNavigationItem(id: string): Promise<void> {
  await getNavigationById(id);

  const [child] = await db
    .select({ id: navigationItems.id })
    .from(navigationItems)
    .where(eq(navigationItems.parentId, id));

  if (child) {
    throw new ValidationError('Please delete child menu items first');
  }

  await db.delete(navigationItems).where(eq(navigationItems.id, id));
}

export async function reorderNavigationTree(
  items: Array<{ id: string; parentId: string | null; sortOrder: number }>,
): Promise<void> {
  const idSet = new Set(items.map((item) => item.id));
  if (idSet.size !== items.length) {
    throw new DuplicateError('NavigationItem', 'id', 'duplicate ids in reorder payload');
  }

  const allItems = await db
    .select({ id: navigationItems.id })
    .from(navigationItems);
  const allIdSet = new Set(allItems.map((item) => item.id));

  for (const item of items) {
    if (!allIdSet.has(item.id)) {
      throw new ValidationError(`Navigation item not found: ${item.id}`);
    }
    if (item.parentId && !allIdSet.has(item.parentId)) {
      throw new ValidationError(`Parent navigation item not found: ${item.parentId}`);
    }
    if (item.parentId === item.id) {
      throw new ValidationError('Navigation item cannot set itself as parent');
    }
  }

  const parentMap = new Map(items.map((item) => [item.id, item.parentId]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function detectCycle(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new ValidationError('Navigation tree has circular parent references');
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
        .update(navigationItems)
        .set({
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(navigationItems.id, item.id));
    }
  });
}

function resolvePagePath(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (normalized === 'about') return '/about';
  if (normalized === 'contact') return '/contact';
  if (normalized === 'products') return '/products';
  if (normalized === 'news') return '/news';
  return `/page/${normalized}`;
}

function resolveWebsiteHref(
  item: {
    type: NavigationType;
    url: string | null;
    category?: { slug: string } | null;
    page?: { slug: string } | null;
  },
  locale: string,
  defaultLocale: string,
): string | null {
  if (item.type === 'external') {
    return item.url?.trim() || null;
  }

  if (item.type === 'internal') {
    const internalPath = item.url?.trim();
    if (!internalPath) return null;
    return buildLocalizedPath(internalPath, locale, defaultLocale);
  }

  if (item.type === 'category') {
    if (!item.category?.slug) return null;
    return buildLocalizedPath(`/products/${item.category.slug}`, locale, defaultLocale);
  }

  if (item.type === 'page') {
    if (!item.page?.slug) return null;
    const path = resolvePagePath(item.page.slug);
    return buildLocalizedPath(path, locale, defaultLocale);
  }

  return null;
}

export async function getWebsiteNavigationTree(
  locale: string,
  defaultLocale: string,
): Promise<WebsiteNavigationNode[]> {
  const rows = await db.query.navigationItems.findMany({
    where: eq(navigationItems.isActive, true),
    with: {
      translations: true,
      category: true,
      page: true,
    },
    orderBy: [asc(navigationItems.sortOrder), asc(navigationItems.createdAt)],
  });

  const nodeMap = new Map<string, WebsiteNavigationNode>();
  for (const row of rows) {
    const translated = getTranslation(row.translations, locale, defaultLocale);
    const label = translated?.label?.trim() || '';
    if (!label) continue;

    nodeMap.set(row.id, {
      id: row.id,
      label,
      href: resolveWebsiteHref(
        {
          type: row.type as NavigationType,
          url: row.url,
          category: row.category,
          page: row.page,
        },
        locale,
        defaultLocale,
      ),
      type: row.type as NavigationType,
      openNewTab: row.openNewTab,
      children: [],
    });
  }

  const roots: WebsiteNavigationNode[] = [];
  for (const row of rows) {
    const node = nodeMap.get(row.id);
    if (!node) continue;
    if (row.parentId && nodeMap.has(row.parentId)) {
      nodeMap.get(row.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

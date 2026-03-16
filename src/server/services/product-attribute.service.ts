import { and, asc, desc, eq } from 'drizzle-orm';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import {
  productAttributeGroupTranslations,
  productAttributeGroups,
  productAttributeTranslations,
  productAttributes,
  products,
} from '@/server/db/schema';

type ProductRow = typeof products.$inferSelect;
type GroupRow = typeof productAttributeGroups.$inferSelect;
type GroupTranslationRow = typeof productAttributeGroupTranslations.$inferSelect;
type AttributeRow = typeof productAttributes.$inferSelect;
type AttributeTranslationRow = typeof productAttributeTranslations.$inferSelect;

export interface ProductOption {
  id: string;
  sku: string;
  slug: string;
  displayName: string;
}

export interface ProductAttributeItem extends AttributeRow {
  translations: AttributeTranslationRow[];
  displayName: string;
  displayValue: string;
}

export interface ProductAttributeGroupItem extends GroupRow {
  translations: GroupTranslationRow[];
  displayName: string;
  attributes: ProductAttributeItem[];
}

export interface ProductAttributeEditorData {
  product: ProductOption;
  groups: ProductAttributeGroupItem[];
}

export interface GroupTranslationInput {
  locale: string;
  name?: string;
}

export interface AttributeTranslationInput {
  locale: string;
  name?: string;
  value?: string;
}

function ensureGroupName(translations: GroupTranslationInput[]): void {
  const hasName = translations.some((item) => Boolean(item.name?.trim()));
  if (!hasName) {
    throw new ValidationError('At least one group translation name is required');
  }
}

function ensureAttributeNameAndValue(translations: AttributeTranslationInput[]): void {
  const hasName = translations.some((item) => Boolean(item.name?.trim()));
  const hasValue = translations.some((item) => Boolean(item.value?.trim()));
  if (!hasName || !hasValue) {
    throw new ValidationError('Attribute requires at least one translated name and value');
  }
}

async function getProductOrThrow(productId: string): Promise<ProductRow> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));
  if (!product) {
    throw new NotFoundError('Product', productId);
  }
  return product;
}

async function upsertGroupTranslations(
  groupId: string,
  translations: GroupTranslationInput[],
): Promise<void> {
  for (const item of translations) {
    const locale = item.locale.trim();
    if (!locale) continue;

    const values = {
      name: item.name?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(productAttributeGroupTranslations)
      .where(
        and(
          eq(productAttributeGroupTranslations.groupId, groupId),
          eq(productAttributeGroupTranslations.locale, locale),
        ),
      );

    if (existing) {
      await db
        .update(productAttributeGroupTranslations)
        .set(values)
        .where(eq(productAttributeGroupTranslations.id, existing.id));
      continue;
    }

    await db.insert(productAttributeGroupTranslations).values({
      groupId,
      locale,
      ...values,
    });
  }
}

async function upsertAttributeTranslations(
  attributeId: string,
  translations: AttributeTranslationInput[],
): Promise<void> {
  for (const item of translations) {
    const locale = item.locale.trim();
    if (!locale) continue;

    const values = {
      name: item.name?.trim() || null,
      value: item.value?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(productAttributeTranslations)
      .where(
        and(
          eq(productAttributeTranslations.attributeId, attributeId),
          eq(productAttributeTranslations.locale, locale),
        ),
      );

    if (existing) {
      await db
        .update(productAttributeTranslations)
        .set(values)
        .where(eq(productAttributeTranslations.id, existing.id));
      continue;
    }

    await db.insert(productAttributeTranslations).values({
      attributeId,
      locale,
      ...values,
    });
  }
}

export async function getProductOptions(
  locale: string,
  defaultLocale: string,
): Promise<ProductOption[]> {
  const rows = await db.query.products.findMany({
    with: { translations: true },
    orderBy: [desc(products.updatedAt), asc(products.sku)],
  });

  return rows.map((item) => {
    const translated = getTranslation(item.translations, locale, defaultLocale);
    const displayName =
      typeof translated?.name === 'string' && translated.name ? translated.name : item.sku;
    return {
      id: item.id,
      sku: item.sku,
      slug: item.slug,
      displayName,
    };
  });
}

export async function getProductAttributeEditorData(
  productId: string,
  locale: string,
  defaultLocale: string,
): Promise<ProductAttributeEditorData> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: { translations: true },
  });
  if (!product) {
    throw new NotFoundError('Product', productId);
  }

  const translatedProduct = getTranslation(product.translations, locale, defaultLocale);
  const productName =
    typeof translatedProduct?.name === 'string' && translatedProduct.name
      ? translatedProduct.name
      : product.sku;

  const groups = await db.query.productAttributeGroups.findMany({
    where: eq(productAttributeGroups.productId, productId),
    with: {
      translations: true,
      attributes: {
        with: {
          translations: true,
        },
      },
    },
    orderBy: [asc(productAttributeGroups.sortOrder)],
  });

  return {
    product: {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      displayName: productName,
    },
    groups: groups.map((group) => ({
      ...group,
      displayName: (() => {
        const translatedGroup = getTranslation(group.translations, locale, defaultLocale);
        if (typeof translatedGroup?.name === 'string' && translatedGroup.name) {
          return translatedGroup.name;
        }
        return '(未命名分组)';
      })(),
      attributes: [...group.attributes]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((attribute) => {
          const translated = getTranslation(attribute.translations, locale, defaultLocale);
          return {
            ...attribute,
            displayName: translated?.name ?? '(未命名参数)',
            displayValue:
              typeof translated?.value === 'string' && translated.value
                ? translated.value
                : '-',
          };
        }),
    })),
  };
}

export async function createAttributeGroup(input: {
  productId: string;
  translations: GroupTranslationInput[];
  sortOrder?: number;
}): Promise<ProductAttributeGroupItem> {
  await getProductOrThrow(input.productId);
  ensureGroupName(input.translations);

  const sortOrder =
    input.sortOrder ??
    (await db
      .select()
      .from(productAttributeGroups)
      .where(eq(productAttributeGroups.productId, input.productId))).length;

  const [created] = await db
    .insert(productAttributeGroups)
    .values({
      productId: input.productId,
      sortOrder,
    })
    .returning();

  await upsertGroupTranslations(created.id, input.translations);
  const data = await getProductAttributeEditorData(input.productId, 'zh-CN', 'zh-CN');
  const found = data.groups.find((group) => group.id === created.id);
  if (!found) {
    throw new NotFoundError('ProductAttributeGroup', created.id);
  }
  return found;
}

export async function updateAttributeGroup(
  groupId: string,
  input: {
    translations?: GroupTranslationInput[];
    sortOrder?: number;
  },
): Promise<void> {
  const group = await db.query.productAttributeGroups.findFirst({
    where: eq(productAttributeGroups.id, groupId),
  });
  if (!group) {
    throw new NotFoundError('ProductAttributeGroup', groupId);
  }

  await db
    .update(productAttributeGroups)
    .set({
      sortOrder: input.sortOrder ?? group.sortOrder,
    })
    .where(eq(productAttributeGroups.id, groupId));

  if (input.translations) {
    ensureGroupName(input.translations);
    await upsertGroupTranslations(groupId, input.translations);
  }
}

export async function deleteAttributeGroup(groupId: string): Promise<void> {
  const group = await db.query.productAttributeGroups.findFirst({
    where: eq(productAttributeGroups.id, groupId),
  });
  if (!group) {
    throw new NotFoundError('ProductAttributeGroup', groupId);
  }
  await db.delete(productAttributeGroups).where(eq(productAttributeGroups.id, groupId));
}

export async function createAttribute(input: {
  groupId: string;
  translations: AttributeTranslationInput[];
  sortOrder?: number;
}): Promise<void> {
  const group = await db.query.productAttributeGroups.findFirst({
    where: eq(productAttributeGroups.id, input.groupId),
  });
  if (!group) {
    throw new NotFoundError('ProductAttributeGroup', input.groupId);
  }

  ensureAttributeNameAndValue(input.translations);

  const sortOrder =
    input.sortOrder ??
    (await db
      .select()
      .from(productAttributes)
      .where(eq(productAttributes.groupId, input.groupId))).length;

  const [created] = await db
    .insert(productAttributes)
    .values({
      groupId: input.groupId,
      sortOrder,
    })
    .returning();

  await upsertAttributeTranslations(created.id, input.translations);
}

export async function updateAttribute(
  attributeId: string,
  input: {
    groupId?: string;
    translations?: AttributeTranslationInput[];
    sortOrder?: number;
  },
): Promise<void> {
  const attribute = await db.query.productAttributes.findFirst({
    where: eq(productAttributes.id, attributeId),
  });
  if (!attribute) {
    throw new NotFoundError('ProductAttribute', attributeId);
  }

  if (input.groupId) {
    const group = await db.query.productAttributeGroups.findFirst({
      where: eq(productAttributeGroups.id, input.groupId),
    });
    if (!group) {
      throw new NotFoundError('ProductAttributeGroup', input.groupId);
    }
  }

  await db
    .update(productAttributes)
    .set({
      groupId: input.groupId ?? attribute.groupId,
      sortOrder: input.sortOrder ?? attribute.sortOrder,
    })
    .where(eq(productAttributes.id, attributeId));

  if (input.translations) {
    ensureAttributeNameAndValue(input.translations);
    await upsertAttributeTranslations(attributeId, input.translations);
  }
}

export async function deleteAttribute(attributeId: string): Promise<void> {
  const attribute = await db.query.productAttributes.findFirst({
    where: eq(productAttributes.id, attributeId),
  });
  if (!attribute) {
    throw new NotFoundError('ProductAttribute', attributeId);
  }
  await db.delete(productAttributes).where(eq(productAttributes.id, attributeId));
}

export async function reorderAttributeGroups(
  productId: string,
  orderedGroupIds: string[],
): Promise<void> {
  await getProductOrThrow(productId);
  if (orderedGroupIds.length === 0) return;

  const rows = await db
    .select({ id: productAttributeGroups.id })
    .from(productAttributeGroups)
    .where(eq(productAttributeGroups.productId, productId));
  const currentIds = new Set(rows.map((item) => item.id));

  if (orderedGroupIds.some((id) => !currentIds.has(id))) {
    throw new ValidationError('Group reorder list contains invalid ids');
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedGroupIds.length; index += 1) {
      await tx
        .update(productAttributeGroups)
        .set({ sortOrder: index })
        .where(eq(productAttributeGroups.id, orderedGroupIds[index]));
    }
  });
}

export async function reorderAttributes(
  groupId: string,
  orderedAttributeIds: string[],
): Promise<void> {
  const group = await db.query.productAttributeGroups.findFirst({
    where: eq(productAttributeGroups.id, groupId),
  });
  if (!group) {
    throw new NotFoundError('ProductAttributeGroup', groupId);
  }
  if (orderedAttributeIds.length === 0) return;

  const rows = await db
    .select({ id: productAttributes.id })
    .from(productAttributes)
    .where(eq(productAttributes.groupId, groupId));
  const currentIds = new Set(rows.map((item) => item.id));

  if (orderedAttributeIds.some((id) => !currentIds.has(id))) {
    throw new ValidationError('Attribute reorder list contains invalid ids');
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedAttributeIds.length; index += 1) {
      await tx
        .update(productAttributes)
        .set({ sortOrder: index })
        .where(eq(productAttributes.id, orderedAttributeIds[index]));
    }
  });
}

export async function bulkImportAttributes(input: {
  productId: string;
  locale: string;
  rows: Array<{ group: string; name: string; value: string }>;
}): Promise<{ groupsCreated: number; attributesCreated: number }> {
  const { productId, locale, rows } = input;
  if (rows.length === 0) {
    throw new ValidationError('导入数据不能为空');
  }

  await getProductOrThrow(productId);

  const groupedRows = new Map<string, Array<{ name: string; value: string }>>();
  for (const row of rows) {
    const groupName = row.group.trim();
    const name = row.name.trim();
    const value = row.value.trim();
    if (!groupName || !name) continue;
    const list = groupedRows.get(groupName) ?? [];
    list.push({ name, value });
    groupedRows.set(groupName, list);
  }

  if (groupedRows.size === 0) {
    throw new ValidationError('没有有效的导入数据（分组名和参数名不能为空）');
  }

  const existingGroups = await db.query.productAttributeGroups.findMany({
    where: eq(productAttributeGroups.productId, productId),
    with: { translations: true },
    orderBy: [asc(productAttributeGroups.sortOrder)],
  });

  const groupNameToId = new Map<string, string>();
  for (const g of existingGroups) {
    for (const t of g.translations) {
      if (t.locale === locale && t.name) {
        groupNameToId.set(t.name, g.id);
      }
    }
  }

  let nextGroupSort = existingGroups.length;
  let groupsCreated = 0;
  let attributesCreated = 0;

  await db.transaction(async (tx) => {
    for (const [groupName, attrs] of groupedRows) {
      let groupId = groupNameToId.get(groupName);

      if (!groupId) {
        const [newGroup] = await tx
          .insert(productAttributeGroups)
          .values({ productId, sortOrder: nextGroupSort++ })
          .returning();
        await tx.insert(productAttributeGroupTranslations).values({
          groupId: newGroup.id,
          locale,
          name: groupName,
        });
        groupId = newGroup.id;
        groupNameToId.set(groupName, groupId);
        groupsCreated++;
      }

      const existingAttrs = await tx
        .select()
        .from(productAttributes)
        .where(eq(productAttributes.groupId, groupId));
      let nextAttrSort = existingAttrs.length;

      for (const attr of attrs) {
        const [newAttr] = await tx
          .insert(productAttributes)
          .values({ groupId: groupId!, sortOrder: nextAttrSort++ })
          .returning();
        await tx.insert(productAttributeTranslations).values({
          attributeId: newAttr.id,
          locale,
          name: attr.name,
          value: attr.value || null,
        });
        attributesCreated++;
      }
    }
  });

  return { groupsCreated, attributesCreated };
}

export async function copyAttributesFromProduct(input: {
  sourceProductId: string;
  targetProductId: string;
  copyValues: boolean;
}): Promise<{ groupsCopied: number; attributesCopied: number }> {
  const { sourceProductId, targetProductId, copyValues } = input;
  if (sourceProductId === targetProductId) {
    throw new ValidationError('不能从自身复制参数');
  }

  await getProductOrThrow(sourceProductId);
  await getProductOrThrow(targetProductId);

  const sourceGroups = await db.query.productAttributeGroups.findMany({
    where: eq(productAttributeGroups.productId, sourceProductId),
    with: {
      translations: true,
      attributes: { with: { translations: true } },
    },
    orderBy: [asc(productAttributeGroups.sortOrder)],
  });

  if (sourceGroups.length === 0) {
    throw new ValidationError('来源产品没有可复制的参数');
  }

  const existingGroups = await db
    .select()
    .from(productAttributeGroups)
    .where(eq(productAttributeGroups.productId, targetProductId));
  let nextGroupSort = existingGroups.length;

  let groupsCopied = 0;
  let attributesCopied = 0;

  await db.transaction(async (tx) => {
    for (const group of sourceGroups) {
      const [newGroup] = await tx
        .insert(productAttributeGroups)
        .values({
          productId: targetProductId,
          sortOrder: nextGroupSort++,
        })
        .returning();

      if (group.translations.length > 0) {
        await tx.insert(productAttributeGroupTranslations).values(
          group.translations.map((t) => ({
            groupId: newGroup.id,
            locale: t.locale,
            name: t.name,
          })),
        );
      }
      groupsCopied++;

      const sortedAttrs = [...group.attributes].sort((a, b) => a.sortOrder - b.sortOrder);
      for (let i = 0; i < sortedAttrs.length; i++) {
        const attr = sortedAttrs[i];
        const [newAttr] = await tx
          .insert(productAttributes)
          .values({
            groupId: newGroup.id,
            sortOrder: i,
          })
          .returning();

        if (attr.translations.length > 0) {
          await tx.insert(productAttributeTranslations).values(
            attr.translations.map((t) => ({
              attributeId: newAttr.id,
              locale: t.locale,
              name: t.name,
              value: copyValues ? t.value : null,
            })),
          );
        }
        attributesCopied++;
      }
    }
  });

  return { groupsCopied, attributesCopied };
}

export async function moveAttributeToGroup(
  attributeId: string,
  targetGroupId: string,
): Promise<void> {
  const attribute = await db.query.productAttributes.findFirst({
    where: eq(productAttributes.id, attributeId),
  });
  if (!attribute) {
    throw new NotFoundError('ProductAttribute', attributeId);
  }

  const targetGroup = await db.query.productAttributeGroups.findFirst({
    where: eq(productAttributeGroups.id, targetGroupId),
  });
  if (!targetGroup) {
    throw new NotFoundError('ProductAttributeGroup', targetGroupId);
  }

  const oldGroup = await db.query.productAttributeGroups.findFirst({
    where: eq(productAttributeGroups.id, attribute.groupId),
  });
  if (!oldGroup) {
    throw new NotFoundError('ProductAttributeGroup', attribute.groupId);
  }

  if (oldGroup.productId !== targetGroup.productId) {
    throw new ValidationError('Cannot move attribute across different products');
  }

  const targetCount = await db
    .select({ id: productAttributes.id })
    .from(productAttributes)
    .where(eq(productAttributes.groupId, targetGroupId));

  await db
    .update(productAttributes)
    .set({
      groupId: targetGroupId,
      sortOrder: targetCount.length,
    })
    .where(eq(productAttributes.id, attributeId));

  const oldRows = await db
    .select({ id: productAttributes.id })
    .from(productAttributes)
    .where(eq(productAttributes.groupId, oldGroup.id))
    .orderBy(asc(productAttributes.sortOrder));

  await db.transaction(async (tx) => {
    for (let index = 0; index < oldRows.length; index += 1) {
      await tx
        .update(productAttributes)
        .set({ sortOrder: index })
        .where(eq(productAttributes.id, oldRows[index].id));
    }
  });
}

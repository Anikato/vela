import { eq, and, ne } from 'drizzle-orm';

import { db } from '@/server/db';
import { themes } from '@/server/db/schema';
import { DEFAULT_THEME_CONFIG, type ThemeConfig } from '@/types/theme';

export interface ThemeListItem {
  id: string;
  name: string;
  isActive: boolean;
  isPreset: boolean;
  config: ThemeConfig;
  createdAt: Date;
  updatedAt: Date;
}

export async function getThemeList(): Promise<ThemeListItem[]> {
  const rows = await db.select().from(themes).orderBy(themes.createdAt);
  return rows.map((r) => ({
    ...r,
    config: (r.config ?? DEFAULT_THEME_CONFIG) as ThemeConfig,
  }));
}

export async function getActiveTheme(): Promise<ThemeListItem | null> {
  const row = await db.query.themes.findFirst({
    where: eq(themes.isActive, true),
  });
  if (!row) return null;
  return { ...row, config: (row.config ?? DEFAULT_THEME_CONFIG) as ThemeConfig };
}

export async function getThemeById(id: string): Promise<ThemeListItem | null> {
  const row = await db.query.themes.findFirst({
    where: eq(themes.id, id),
  });
  if (!row) return null;
  return { ...row, config: (row.config ?? DEFAULT_THEME_CONFIG) as ThemeConfig };
}

export async function createTheme(
  name: string,
  config: ThemeConfig,
): Promise<ThemeListItem> {
  const [row] = await db
    .insert(themes)
    .values({ name, config: config as unknown as Record<string, unknown>, isPreset: false, isActive: false })
    .returning();
  return { ...row, config };
}

export async function updateTheme(
  id: string,
  data: { name?: string; config?: ThemeConfig },
): Promise<ThemeListItem> {
  const existing = await getThemeById(id);
  if (!existing) throw new Error('主题不存在');

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.config !== undefined) updateData.config = data.config as unknown as Record<string, unknown>;

  const [row] = await db
    .update(themes)
    .set(updateData)
    .where(eq(themes.id, id))
    .returning();

  return { ...row, config: (row.config ?? DEFAULT_THEME_CONFIG) as ThemeConfig };
}

export async function activateTheme(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(themes).set({ isActive: false }).where(ne(themes.id, id));
    await tx.update(themes).set({ isActive: true, updatedAt: new Date() }).where(eq(themes.id, id));
  });
}

export async function deleteTheme(id: string): Promise<void> {
  const existing = await getThemeById(id);
  if (!existing) throw new Error('主题不存在');
  if (existing.isPreset) throw new Error('预设主题不可删除');
  if (existing.isActive) throw new Error('不能删除激活中的主题');

  await db.delete(themes).where(eq(themes.id, id));
}

export async function ensureDefaultTheme(): Promise<void> {
  const allThemes = await db.select({ id: themes.id }).from(themes);
  if (allThemes.length === 0) {
    await db.insert(themes).values({
      name: 'Default',
      isPreset: true,
      isActive: true,
      config: DEFAULT_THEME_CONFIG as unknown as Record<string, unknown>,
    });
  }
}

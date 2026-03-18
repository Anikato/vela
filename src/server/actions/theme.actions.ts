'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import type { ActionResult } from '@/types';
import { requireAuth } from '@/server/actions/lib/auth';
import { DEFAULT_THEME_CONFIG, type ThemeConfig } from '@/types/theme';
import {
  getThemeList,
  createTheme,
  updateTheme,
  activateTheme,
  deleteTheme,
  type ThemeListItem,
} from '@/server/services/theme.service';

const colorsSchema = z.object({
  primary: z.string(),
  primaryForeground: z.string(),
  secondary: z.string(),
  secondaryForeground: z.string(),
  accent: z.string(),
  accentForeground: z.string(),
  background: z.string(),
  foreground: z.string(),
  muted: z.string(),
  mutedForeground: z.string(),
  card: z.string(),
  cardForeground: z.string(),
  destructive: z.string(),
  destructiveForeground: z.string(),
  border: z.string(),
  ring: z.string(),
});

const fontsSchema = z.object({
  latin: z.string(),
  cjk: z.string(),
  arabic: z.string(),
  headingWeight: z.string(),
  bodySize: z.string(),
});

const buttonSchema = z.object({
  shape: z.enum(['square', 'soft', 'rounded', 'pill']),
  size: z.enum(['compact', 'default', 'large', 'xl']),
  animation: z.enum(['none', 'lift', 'scale', 'shine', 'glow']),
  uppercase: z.boolean(),
  fontWeight: z.string(),
  shadow: z.boolean(),
});

const navSchema = z.object({
  style: z.enum(['default', 'minimal', 'pill', 'underline', 'border']),
  spacing: z.enum(['compact', 'default', 'loose']),
  uppercase: z.boolean(),
  fontWeight: z.string(),
});

const backgroundSchema = z.object({
  type: z.enum(['solid', 'gradient', 'image']),
  gradient: z.string().optional(),
  imageUrl: z.string().optional(),
  imageOverlay: z.number().min(0).max(100).optional(),
}).optional();

const layoutSchema = z.object({
  headerStyle: z.enum(['default', 'centered', 'minimal', 'two-row', 'tall-logo']),
  headerTransparent: z.boolean(),
  footerStyle: z.enum(['standard', 'minimal', 'expanded']),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
  shadow: z.enum(['none', 'sm', 'md', 'lg']),
  maxWidth: z.string(),
  pageBackground: backgroundSchema,
  headerBackground: backgroundSchema,
  headerBlur: z.boolean().optional(),
  footerBackground: backgroundSchema,
  logoHeight: z.number().min(20).max(200).optional(),
});

const productCardSchema = z.object({
  imageRatio: z.enum(['1:1', '4:3', '3:2', '16:9']),
  hoverEffect: z.enum(['none', 'lift', 'scale', 'border-glow', 'shadow']),
  showSku: z.boolean(),
  showDescription: z.boolean(),
  gridColumns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
}).optional();

const announcementBarSchema = z.object({
  enabled: z.boolean(),
  bgColor: z.string(),
  textColor: z.string(),
  dismissible: z.boolean(),
  linkUrl: z.string().optional(),
}).optional();

const themeConfigSchema = z.object({
  colors: colorsSchema,
  fonts: fontsSchema,
  button: buttonSchema,
  nav: navSchema,
  layout: layoutSchema,
  productCard: productCardSchema,
  announcementBar: announcementBarSchema,
  customCss: z.string().max(10000).optional(),
});

export async function getThemeListAction(): Promise<ActionResult<ThemeListItem[]>> {
  try {
    await requireAuth();
    const data = await getThemeList();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '获取主题列表失败' };
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  config: themeConfigSchema.optional(),
});

export async function createThemeAction(
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<ThemeListItem>> {
  try {
    await requireAuth();
    const { name, config } = createSchema.parse(input);
    const themeConfig: ThemeConfig = config
      ? { ...DEFAULT_THEME_CONFIG, ...config, productCard: { ...DEFAULT_THEME_CONFIG.productCard, ...config.productCard }, announcementBar: { ...DEFAULT_THEME_CONFIG.announcementBar, ...config.announcementBar }, layout: { ...DEFAULT_THEME_CONFIG.layout, ...config.layout } }
      : DEFAULT_THEME_CONFIG;
    const data = await createTheme(name, themeConfig);
    revalidateTag('theme', 'max');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '创建主题失败' };
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  config: themeConfigSchema.optional(),
});

export async function updateThemeAction(
  input: z.infer<typeof updateSchema>,
): Promise<ActionResult<ThemeListItem>> {
  try {
    await requireAuth();
    const { id, name, config } = updateSchema.parse(input);
    const mergedConfig: ThemeConfig | undefined = config
      ? { ...DEFAULT_THEME_CONFIG, ...config, productCard: { ...DEFAULT_THEME_CONFIG.productCard, ...config.productCard }, announcementBar: { ...DEFAULT_THEME_CONFIG.announcementBar, ...config.announcementBar }, layout: { ...DEFAULT_THEME_CONFIG.layout, ...config.layout } }
      : undefined;
    const data = await updateTheme(id, { name, config: mergedConfig });
    revalidateTag('theme', 'max');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '更新主题失败' };
  }
}

const activateSchema = z.object({ id: z.string().uuid() });

export async function activateThemeAction(
  input: z.infer<typeof activateSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { id } = activateSchema.parse(input);
    await activateTheme(id);
    revalidateTag('theme', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '激活主题失败' };
  }
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteThemeAction(
  input: z.infer<typeof deleteSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { id } = deleteSchema.parse(input);
    await deleteTheme(id);
    revalidateTag('theme', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '删除主题失败' };
  }
}

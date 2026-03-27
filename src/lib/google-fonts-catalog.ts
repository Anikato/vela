/**
 * Google Fonts 精选目录
 *
 * key   = 用户友好的字体名（存入数据库、设置 CSS 变量的值）
 * value = Google Fonts API query 参数（用于生成 <link> 标签）
 *
 * 按类别分组，方便在 UI 下拉中展示。
 */

export interface FontEntry {
  name: string;
  family: string;      // Google Fonts API family 参数（含 weights）
  category: FontCategory;
  sample?: string;     // 预览字符串（留空则用默认）
}

export type FontCategory =
  | 'sans-serif'
  | 'serif'
  | 'display'
  | 'monospace'
  | 'cjk';

export const GOOGLE_FONTS: FontEntry[] = [
  // ── Sans-Serif ─────────────────────────────────────────────────────────────
  { name: 'Inter',            family: 'Inter:wght@300;400;500;600;700',            category: 'sans-serif' },
  { name: 'Outfit',           family: 'Outfit:wght@300;400;500;600;700',           category: 'sans-serif' },
  { name: 'Poppins',          family: 'Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', category: 'sans-serif' },
  { name: 'Nunito',           family: 'Nunito:wght@300;400;500;600;700',           category: 'sans-serif' },
  { name: 'DM Sans',          family: 'DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans',family: 'Plus+Jakarta+Sans:wght@300;400;500;600;700', category: 'sans-serif' },
  { name: 'Jost',             family: 'Jost:wght@300;400;500;600;700',             category: 'sans-serif' },
  { name: 'Work Sans',        family: 'Work+Sans:wght@300;400;500;600;700',        category: 'sans-serif' },
  { name: 'Raleway',          family: 'Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', category: 'sans-serif' },
  { name: 'Open Sans',        family: 'Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400', category: 'sans-serif' },
  { name: 'Lato',             family: 'Lato:ital,wght@0,300;0,400;0,700;1,400',   category: 'sans-serif' },
  { name: 'Mulish',           family: 'Mulish:wght@300;400;500;600;700',           category: 'sans-serif' },
  { name: 'Rubik',            family: 'Rubik:ital,wght@0,300;0,400;0,500;0,700;1,400', category: 'sans-serif' },
  { name: 'Urbanist',         family: 'Urbanist:wght@300;400;500;600;700',         category: 'sans-serif' },
  { name: 'Source Sans 3',    family: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400', category: 'sans-serif' },

  // ── Serif ──────────────────────────────────────────────────────────────────
  { name: 'Playfair Display', family: 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400', category: 'serif' },
  { name: 'Cormorant Garamond',family:'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', category: 'serif' },
  { name: 'Lora',             family: 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400', category: 'serif' },
  { name: 'Merriweather',     family: 'Merriweather:ital,wght@0,300;0,400;0,700;1,400', category: 'serif' },
  { name: 'EB Garamond',      family: 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400', category: 'serif' },
  { name: 'Libre Baskerville',family: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400', category: 'serif' },
  { name: 'Crimson Pro',      family: 'Crimson+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400', category: 'serif' },

  // ── Display / Creative ─────────────────────────────────────────────────────
  { name: 'Space Grotesk',    family: 'Space+Grotesk:wght@300;400;500;600;700',    category: 'display' },
  { name: 'Syne',             family: 'Syne:wght@400;500;600;700;800',             category: 'display' },
  { name: 'Montserrat',       family: 'Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', category: 'display' },
  { name: 'Josefin Sans',     family: 'Josefin+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400', category: 'display' },
  { name: 'Manrope',          family: 'Manrope:wght@300;400;500;600;700;800',      category: 'display' },

  // ── Monospace ──────────────────────────────────────────────────────────────
  { name: 'JetBrains Mono',   family: 'JetBrains+Mono:ital,wght@0,400;0,500;1,400', category: 'monospace' },
  { name: 'Fira Code',        family: 'Fira+Code:wght@400;500;600',               category: 'monospace' },

  // ── CJK ────────────────────────────────────────────────────────────────────
  { name: 'Noto Sans SC',     family: 'Noto+Sans+SC:wght@300;400;500;700',        category: 'cjk' },
  { name: 'Noto Serif SC',    family: 'Noto+Serif+SC:wght@300;400;500;700',       category: 'cjk' },
  { name: 'ZCOOL XiaoWei',    family: 'ZCOOL+XiaoWei',                            category: 'cjk' },
  { name: 'ZCOOL QingKe HuangYou', family: 'ZCOOL+QingKe+HuangYou',             category: 'cjk' },
  { name: 'Ma Shan Zheng',    family: 'Ma+Shan+Zheng',                            category: 'cjk' },
  { name: 'Long Cang',        family: 'Long+Cang',                                category: 'cjk' },
];

/** key → FontEntry 映射，O(1) 查找 */
export const GOOGLE_FONTS_MAP = new Map<string, FontEntry>(
  GOOGLE_FONTS.map((f) => [f.name, f]),
);

/** 生成 Google Fonts URL，支持多个字体合并到一个请求 */
export function buildGoogleFontsUrl(fontNames: string[]): string | null {
  const families = fontNames
    .map((name) => GOOGLE_FONTS_MAP.get(name)?.family)
    .filter((f): f is string => f !== undefined);

  if (families.length === 0) return null;

  return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
}

export const FONT_CATEGORIES: Record<FontCategory, string> = {
  'sans-serif': '无衬线（现代/通用）',
  'serif':      '衬线（优雅/传统）',
  'display':    '展示（个性/创意）',
  'monospace':  '等宽（代码/技术）',
  'cjk':        '中日韩文字',
};

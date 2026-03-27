'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Check,
  Palette,
  Type,
  MousePointer,
  Navigation,
  Layout,
  Copy,
  Image as ImageIcon,
  ShoppingBag,
  Megaphone,
  Code,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  getThemeListAction,
  createThemeAction,
  updateThemeAction,
  activateThemeAction,
  deleteThemeAction,
} from '@/server/actions/theme.actions';
import {
  DEFAULT_THEME_CONFIG,
  type ThemeConfig,
  type ThemeColors,
  type ThemeBackground,
  type ButtonShape,
  type ButtonSize,
  type ButtonAnimation,
  type NavStyle,
  type NavSpacing,
  type HeaderStyle,
  type FooterStyle,
  type RadiusPreset,
  type ShadowPreset,
  type CardHoverEffect,
  type CardImageRatio,
  type ProductGridColumns,
} from '@/types/theme';
import type { ThemeListItem } from '@/types/admin';
import { ColorInput } from './color-input';
import {
  GOOGLE_FONTS,
  FONT_CATEGORIES,
  buildGoogleFontsUrl,
  type FontCategory,
} from '@/lib/google-fonts-catalog';

interface Props {
  initialThemes: ThemeListItem[];
}

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: '主色',
  primaryForeground: '主色前景',
  secondary: '次要色',
  secondaryForeground: '次要色前景',
  accent: '强调色',
  accentForeground: '强调色前景',
  background: '背景色',
  foreground: '前景色',
  muted: '柔和色',
  mutedForeground: '柔和色前景',
  card: '卡片色',
  cardForeground: '卡片前景',
  destructive: '错误色',
  destructiveForeground: '错误色前景',
  border: '边框色',
  ring: '聚焦色',
};

const BUTTON_SHAPES: { value: ButtonShape; label: string }[] = [
  { value: 'square', label: '方形' },
  { value: 'soft', label: '柔和' },
  { value: 'rounded', label: '圆角' },
  { value: 'pill', label: '胶囊' },
];

const BUTTON_SIZES: { value: ButtonSize; label: string }[] = [
  { value: 'compact', label: '紧凑' },
  { value: 'default', label: '标准' },
  { value: 'large', label: '大' },
  { value: 'xl', label: '超大' },
];

const BUTTON_ANIMATIONS: { value: ButtonAnimation; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'lift', label: '浮起' },
  { value: 'scale', label: '缩放' },
  { value: 'shine', label: '闪光' },
  { value: 'glow', label: '发光' },
];

const NAV_STYLES: { value: NavStyle; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'minimal', label: '极简' },
  { value: 'pill', label: '胶囊' },
  { value: 'underline', label: '下划线' },
  { value: 'border', label: '边框' },
];

const NAV_SPACINGS: { value: NavSpacing; label: string }[] = [
  { value: 'compact', label: '紧凑' },
  { value: 'default', label: '标准' },
  { value: 'loose', label: '宽松' },
];

const HEADER_STYLES: { value: HeaderStyle; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'centered', label: '居中' },
  { value: 'minimal', label: '极简' },
  { value: 'two-row', label: '双行' },
  { value: 'tall-logo', label: '高 Logo' },
];

const FOOTER_STYLES: { value: FooterStyle; label: string }[] = [
  { value: 'standard', label: '标准' },
  { value: 'minimal', label: '极简' },
  { value: 'expanded', label: '扩展' },
];

const RADIUS_PRESETS: { value: RadiusPreset; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
  { value: 'full', label: '全圆' },
];

const SHADOW_PRESETS: { value: ShadowPreset; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'sm', label: '微弱' },
  { value: 'md', label: '中等' },
  { value: 'lg', label: '强' },
];

const CARD_IMAGE_RATIOS: { value: CardImageRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '16:9', label: '16:9' },
];

const CARD_HOVER_EFFECTS: { value: CardHoverEffect; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'lift', label: '浮起' },
  { value: 'scale', label: '缩放' },
  { value: 'border-glow', label: '边框光效' },
  { value: 'shadow', label: '阴影' },
];

const GRID_COLUMNS: { value: ProductGridColumns; label: string }[] = [
  { value: 2, label: '2 列' },
  { value: 3, label: '3 列' },
  { value: 4, label: '4 列' },
];

const BG_TYPES: { value: ThemeBackground['type']; label: string }[] = [
  { value: 'solid', label: '纯色' },
  { value: 'gradient', label: '渐变' },
  { value: 'image', label: '图片' },
];

const GRADIENT_PRESETS = [
  { name: '暖白纸质', css: 'radial-gradient(ellipse at center, hsl(40 30% 97%) 0%, hsl(35 20% 94%) 100%)' },
  { name: '奶油色', css: 'linear-gradient(180deg, hsl(45 40% 97%) 0%, hsl(40 25% 95%) 100%)' },
  { name: '亚麻纹理', css: 'radial-gradient(ellipse at top, hsl(30 25% 96%) 0%, hsl(25 15% 93%) 60%, hsl(20 20% 91%) 100%)' },
  { name: '冷灰渐变', css: 'linear-gradient(180deg, hsl(220 15% 97%) 0%, hsl(215 10% 93%) 100%)' },
  { name: '海洋渐变', css: 'linear-gradient(135deg, hsl(200 80% 94%) 0%, hsl(210 60% 88%) 100%)' },
  { name: '日落渐变', css: 'linear-gradient(135deg, hsl(25 90% 95%) 0%, hsl(340 60% 92%) 100%)' },
  { name: '薰衣草', css: 'linear-gradient(135deg, hsl(270 50% 96%) 0%, hsl(260 40% 92%) 100%)' },
  { name: '薄荷清新', css: 'linear-gradient(135deg, hsl(160 40% 95%) 0%, hsl(170 35% 91%) 100%)' },
  { name: '深空', css: 'linear-gradient(135deg, hsl(230 30% 15%) 0%, hsl(260 35% 20%) 100%)' },
];

type ColorPreset = { name: string; colors: ThemeColors; swatches: string[] };

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: '经典商务',
    swatches: ['222.2 47.4% 11.2%', '210 40% 96.1%', '210 40% 96.1%', '0 0% 100%', '222.2 84% 4.9%'],
    colors: DEFAULT_THEME_CONFIG.colors,
  },
  {
    name: '海洋蓝',
    swatches: ['210 100% 45%', '200 80% 92%', '200 60% 94%', '210 20% 99%', '210 50% 10%'],
    colors: {
      primary: '210 100% 45%', primaryForeground: '0 0% 100%',
      secondary: '200 80% 92%', secondaryForeground: '210 50% 15%',
      accent: '200 60% 94%', accentForeground: '210 50% 15%',
      background: '210 20% 99%', foreground: '210 50% 10%',
      muted: '200 30% 95%', mutedForeground: '210 15% 45%',
      card: '0 0% 100%', cardForeground: '210 50% 10%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      border: '210 25% 90%', ring: '210 100% 45%',
    },
  },
  {
    name: '森林绿',
    swatches: ['152 60% 32%', '150 30% 92%', '148 25% 94%', '140 15% 99%', '150 40% 8%'],
    colors: {
      primary: '152 60% 32%', primaryForeground: '0 0% 100%',
      secondary: '150 30% 92%', secondaryForeground: '150 40% 15%',
      accent: '148 25% 94%', accentForeground: '150 40% 15%',
      background: '140 15% 99%', foreground: '150 40% 8%',
      muted: '148 20% 95%', mutedForeground: '150 10% 45%',
      card: '0 0% 100%', cardForeground: '150 40% 8%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      border: '148 20% 90%', ring: '152 60% 32%',
    },
  },
  {
    name: '暖阳橙',
    swatches: ['25 95% 53%', '30 80% 94%', '28 50% 96%', '35 30% 99%', '20 50% 8%'],
    colors: {
      primary: '25 95% 53%', primaryForeground: '0 0% 100%',
      secondary: '30 80% 94%', secondaryForeground: '20 50% 15%',
      accent: '28 50% 96%', accentForeground: '20 50% 15%',
      background: '35 30% 99%', foreground: '20 50% 8%',
      muted: '30 25% 95%', mutedForeground: '20 15% 45%',
      card: '0 0% 100%', cardForeground: '20 50% 8%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      border: '30 20% 90%', ring: '25 95% 53%',
    },
  },
  {
    name: '优雅紫',
    swatches: ['270 60% 50%', '270 40% 94%', '268 30% 96%', '270 15% 99%', '270 50% 8%'],
    colors: {
      primary: '270 60% 50%', primaryForeground: '0 0% 100%',
      secondary: '270 40% 94%', secondaryForeground: '270 50% 15%',
      accent: '268 30% 96%', accentForeground: '270 50% 15%',
      background: '270 15% 99%', foreground: '270 50% 8%',
      muted: '268 20% 95%', mutedForeground: '270 10% 45%',
      card: '0 0% 100%', cardForeground: '270 50% 8%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      border: '268 20% 90%', ring: '270 60% 50%',
    },
  },
  {
    name: '极简灰',
    swatches: ['220 10% 30%', '220 10% 95%', '220 8% 96%', '0 0% 100%', '220 15% 10%'],
    colors: {
      primary: '220 10% 30%', primaryForeground: '0 0% 100%',
      secondary: '220 10% 95%', secondaryForeground: '220 15% 15%',
      accent: '220 8% 96%', accentForeground: '220 15% 15%',
      background: '0 0% 100%', foreground: '220 15% 10%',
      muted: '220 8% 96%', mutedForeground: '220 8% 46%',
      card: '0 0% 100%', cardForeground: '220 15% 10%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      border: '220 10% 91%', ring: '220 10% 30%',
    },
  },
  {
    name: '中国红',
    swatches: ['0 80% 48%', '0 50% 94%', '0 30% 96%', '0 10% 99%', '0 40% 8%'],
    colors: {
      primary: '0 80% 48%', primaryForeground: '0 0% 100%',
      secondary: '0 50% 94%', secondaryForeground: '0 40% 15%',
      accent: '0 30% 96%', accentForeground: '0 40% 15%',
      background: '0 10% 99%', foreground: '0 40% 8%',
      muted: '0 15% 95%', mutedForeground: '0 10% 45%',
      card: '0 0% 100%', cardForeground: '0 40% 8%',
      destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
      border: '0 15% 90%', ring: '0 80% 48%',
    },
  },
];

// ── 字母间距预设 ────────────────────────────────────────────────────────────
const LETTER_SPACING_OPTIONS = [
  { value: 'normal',   label: '正常' },
  { value: '-0.04em',  label: '紧凑 -4%' },
  { value: '-0.02em',  label: '微紧 -2%' },
  { value: '0.02em',   label: '微松 +2%' },
  { value: '0.05em',   label: '宽松 +5%' },
  { value: '0.1em',    label: '超宽 +10%' },
  { value: '0.2em',    label: '极宽 +20%' },
];

// ── 字体下拉选择器 ──────────────────────────────────────────────────────────
function FontSelect({
  label,
  value,
  onChange,
  allowEmpty,
  emptyLabel,
  filterCategories,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  filterCategories?: FontCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = GOOGLE_FONTS.filter((f) => {
    if (filterCategories && !filterCategories.includes(f.category)) return false;
    return f.name.toLowerCase().includes(search.toLowerCase());
  });

  const grouped: Record<string, typeof filtered> = {};
  for (const f of filtered) {
    const cat = FONT_CATEGORIES[f.category];
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  const displayValue = value || emptyLabel || '（与正文字体相同）';

  return (
    <div className="relative">
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
      >
        <span style={{ fontFamily: value ? `'${value}', sans-serif` : undefined }}>
          {displayValue}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none"
              placeholder="搜索字体…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {allowEmpty && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className={cn(
                  'w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors',
                  !value ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground',
                )}
              >
                {emptyLabel ?? '（与正文字体相同）'}
              </button>
            )}
            {Object.entries(grouped).map(([cat, fonts]) => (
              <div key={cat}>
                <div className="px-3 pt-2 pb-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat}
                </div>
                {fonts.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => { onChange(f.name); setOpen(false); setSearch(''); }}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors flex items-center justify-between',
                      value === f.name ? 'bg-primary/10 text-primary font-medium' : '',
                    )}
                  >
                    <span style={{ fontFamily: `'${f.name}', sans-serif` }}>
                      {f.name} — The quick brown fox
                    </span>
                    {value === f.name && <Check className="h-3 w-3 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">未找到匹配字体</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              value === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BackgroundEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ThemeBackground | undefined;
  onChange: (v: ThemeBackground) => void;
}) {
  const bg = value ?? { type: 'solid' as const };
  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <SelectGroup
        label={label}
        options={BG_TYPES}
        value={bg.type}
        onChange={(v) => onChange({ ...bg, type: v })}
      />
      {bg.type === 'gradient' && (
        <div className="space-y-2">
          <label className="text-sm font-medium mb-1 block">渐变预设</label>
          <div className="grid grid-cols-3 gap-1.5">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange({ ...bg, gradient: preset.css })}
                className="group flex flex-col items-center gap-1 rounded-md border border-border p-1.5 transition-colors hover:border-primary/40"
              >
                <div
                  className="h-6 w-full rounded"
                  style={{ background: preset.css }}
                />
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground">{preset.name}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">自定义渐变 CSS</label>
            <Input
              value={bg.gradient ?? ''}
              onChange={(e) => onChange({ ...bg, gradient: e.target.value })}
              placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
          </div>
          {bg.gradient && (
            <div className="h-10 w-full rounded-md border" style={{ background: bg.gradient }} />
          )}
        </div>
      )}
      {bg.type === 'image' && (
        <>
          <div>
            <label className="text-sm font-medium mb-1 block">图片 URL</label>
            <Input
              value={bg.imageUrl ?? ''}
              onChange={(e) => onChange({ ...bg, imageUrl: e.target.value })}
              placeholder="/uploads/bg.jpg"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">遮罩透明度 (0-100)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={bg.imageOverlay ?? 0}
              onChange={(e) => onChange({ ...bg, imageOverlay: Number(e.target.value) })}
            />
          </div>
        </>
      )}
    </div>
  );
}

function EnhancedPreview({ config }: { config: ThemeConfig }) {
  // 在预览时动态加载所选字体
  useEffect(() => {
    const fontNames = [
      config.fonts.latin,
      config.fonts.cjk,
      config.fonts.headingFont,
    ].filter((f): f is string => Boolean(f));
    const url = buildGoogleFontsUrl([...new Set(fontNames)]);
    if (!url) return;
    const id = 'theme-preview-fonts';
    const existing = document.getElementById(id) as HTMLLinkElement | null;
    if (existing) {
      existing.href = url;
    } else {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  }, [config.fonts.latin, config.fonts.cjk, config.fonts.headingFont]);

  const c = {
    bg: `hsl(${config.colors.background})`,
    fg: `hsl(${config.colors.foreground})`,
    primary: `hsl(${config.colors.primary})`,
    primaryFg: `hsl(${config.colors.primaryForeground})`,
    secondary: `hsl(${config.colors.secondary})`,
    secondaryFg: `hsl(${config.colors.secondaryForeground})`,
    muted: `hsl(${config.colors.muted})`,
    mutedFg: `hsl(${config.colors.mutedForeground})`,
    accent: `hsl(${config.colors.accent})`,
    card: `hsl(${config.colors.card})`,
    cardFg: `hsl(${config.colors.cardForeground})`,
    border: `hsl(${config.colors.border})`,
  };

  // 圆角：根据 layout.radius 设置
  const radiusMap: Record<string, string> = {
    none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px',
  };
  const cardRadius = radiusMap[config.layout.radius] ?? '0.5rem';
  const shadowMap: Record<string, string> = {
    none: 'none', sm: '0 1px 4px rgb(0 0 0 / .06)', md: '0 2px 12px rgb(0 0 0 / .1)', lg: '0 4px 24px rgb(0 0 0 / .14)',
  };
  const cardShadow = shadowMap[config.layout.shadow] ?? 'none';

  const btnRadius = config.button.shape === 'pill' ? '9999px' : config.button.shape === 'square' ? '0' : config.button.shape === 'soft' ? '0.25rem' : cardRadius;
  const btnStyle = {
    borderRadius: btnRadius,
    fontWeight: Number(config.button.fontWeight) || 500,
    textTransform: (config.button.uppercase ? 'uppercase' : undefined) as React.CSSProperties['textTransform'],
    letterSpacing: config.button.uppercase ? '0.05em' : undefined,
  };
  const navStyle = (_label: string) => ({
    fontSize: '0.75rem' as const,
    padding: '0.2rem 0.5rem',
    color: c.mutedFg,
    fontWeight: Number(config.nav.fontWeight) || 500,
    textTransform: (config.nav.uppercase ? 'uppercase' : undefined) as React.CSSProperties['textTransform'],
    letterSpacing: config.nav.uppercase ? '0.05em' : undefined,
    borderBottom: config.nav.style === 'underline' ? `2px solid ${c.primary}` : undefined,
    backgroundColor: config.nav.style === 'pill' ? c.accent : config.nav.style === 'default' ? c.accent : undefined,
    borderRadius: config.nav.style === 'pill' ? '9999px' : config.nav.style === 'default' ? '0.375rem' : undefined,
  });

  const bodyFont = `'${config.fonts.latin}', sans-serif`;
  const headingFont = config.fonts.headingFont
    ? `'${config.fonts.headingFont}', '${config.fonts.latin}', sans-serif`
    : bodyFont;

  const ab = config.announcementBar ?? DEFAULT_THEME_CONFIG.announcementBar;

  // 页面背景
  const pageBg = config.layout?.pageBackground;
  let pageBgStyle: React.CSSProperties = { backgroundColor: c.bg };
  if (pageBg?.type === 'gradient' && pageBg.gradient) {
    pageBgStyle = { background: pageBg.gradient };
  } else if (pageBg?.type === 'image' && pageBg.imageUrl) {
    pageBgStyle = { backgroundImage: `url(${pageBg.imageUrl})`, backgroundSize: 'cover' };
  }

  // Header 背景
  const headerBg = config.layout?.headerBackground;
  let headerBgStyle: React.CSSProperties = { backgroundColor: c.bg };
  if (headerBg?.type === 'gradient' && headerBg.gradient) {
    headerBgStyle = { background: headerBg.gradient };
  } else if (headerBg?.type === 'image' && headerBg.imageUrl) {
    headerBgStyle = { backgroundImage: `url(${headerBg.imageUrl})`, backgroundSize: 'cover' };
  }

  return (
    <div className="text-[11px] leading-relaxed" style={{ fontFamily: bodyFont, ...pageBgStyle }}>
      {/* Announcement Bar */}
      {ab.enabled && (
        <div style={{ backgroundColor: ab.bgColor, color: ab.textColor, padding: '0.25rem 0.5rem', textAlign: 'center', fontSize: '0.6rem' }}>
          📢 公告栏预览文本 — Announcement Bar
        </div>
      )}

      {/* Header */}
      <div style={{ ...headerBgStyle, borderBottom: `1px solid ${c.border}`, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '1.5rem', height: '1.5rem', backgroundColor: c.primary, borderRadius: cardRadius }} />
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['Home', 'Products', 'News', 'Contact'].map((l) => (
              <span key={l} style={navStyle(l)}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: `1px solid ${c.border}` }} />
          <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: `1px solid ${c.border}` }} />
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ backgroundColor: c.primary, color: c.primaryFg, padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ fontFamily: headingFont, fontWeight: Number(config.fonts.headingWeight) || 700, fontSize: '1.1rem', marginBottom: '0.35rem', letterSpacing: config.fonts.letterSpacing ?? 'normal' }}>
          Hero Heading
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.85, marginBottom: '0.75rem' }}>
          Subtitle text goes here — describe your business
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button style={{ ...btnStyle, backgroundColor: c.bg, color: c.fg, padding: '0.35rem 0.75rem', fontSize: '0.65rem', border: 'none', cursor: 'default' }}>
            Primary CTA
          </button>
          <button style={{ ...btnStyle, backgroundColor: 'transparent', color: c.primaryFg, padding: '0.35rem 0.75rem', fontSize: '0.65rem', border: `1px solid ${c.primaryFg}40`, cursor: 'default' }}>
            Secondary
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ color: c.fg, padding: '1rem 0.75rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontFamily: headingFont, fontWeight: Number(config.fonts.headingWeight) || 700, fontSize: '0.85rem', letterSpacing: config.fonts.letterSpacing ?? 'normal' }}>Features</div>
          <div style={{ fontSize: '0.6rem', color: c.mutedFg }}>What we offer</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {['⚡', '🛡️', '🚀'].map((icon, i) => (
            <div key={i} style={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: cardRadius, boxShadow: cardShadow, padding: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.65rem' }}>Feature {i + 1}</div>
              <div style={{ fontSize: '0.55rem', color: c.mutedFg, marginTop: '0.15rem' }}>Short description</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Cards */}
      <div style={{ backgroundColor: c.muted, padding: '1rem 0.75rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem', color: c.fg }}>
          <div style={{ fontFamily: headingFont, fontWeight: Number(config.fonts.headingWeight) || 700, fontSize: '0.85rem', letterSpacing: config.fonts.letterSpacing ?? 'normal' }}>Products</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(config.productCard?.gridColumns ?? 3, 3)}, 1fr)`, gap: '0.4rem' }}>
          {Array.from({ length: Math.min(config.productCard?.gridColumns ?? 3, 3) }).map((_, i) => (
            <div key={i} style={{ backgroundColor: c.card, color: c.cardFg, borderRadius: cardRadius, border: `1px solid ${c.border}`, boxShadow: cardShadow, overflow: 'hidden' }}>
              <div style={{ aspectRatio: config.productCard?.imageRatio?.replace(':', '/') ?? '4/3', backgroundColor: c.secondary }} />
              <div style={{ padding: '0.35rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.6rem' }}>Product Name</div>
                {config.productCard?.showSku !== false && (
                  <div style={{ fontSize: '0.5rem', color: c.mutedFg }}>SKU-00{i + 1}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ backgroundColor: c.primary, color: c.primaryFg, padding: '1.25rem 0.75rem', textAlign: 'center', borderRadius: 0 }}>
        <div style={{ fontFamily: headingFont, fontWeight: Number(config.fonts.headingWeight) || 700, fontSize: '0.85rem', marginBottom: '0.25rem', letterSpacing: config.fonts.letterSpacing ?? 'normal' }}>
          Ready to Get Started?
        </div>
        <div style={{ fontSize: '0.6rem', opacity: 0.85, marginBottom: '0.5rem' }}>
          Contact us today for a free quote
        </div>
        <button style={{ ...btnStyle, backgroundColor: c.bg, color: c.fg, padding: '0.3rem 0.75rem', fontSize: '0.6rem', border: 'none', cursor: 'default' }}>
          Contact Us
        </button>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: c.fg, color: c.bg, padding: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {['Company', 'Products', 'Support'].map((title) => (
            <div key={title}>
              <div style={{ fontWeight: 600, fontSize: '0.6rem', marginBottom: '0.25rem' }}>{title}</div>
              {['Link 1', 'Link 2'].map((link) => (
                <div key={link} style={{ fontSize: '0.5rem', opacity: 0.6 }}>{link}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${c.bg}20`, paddingTop: '0.35rem', textAlign: 'center', fontSize: '0.5rem', opacity: 0.5 }}>
          © 2026 Company Name. All rights reserved.
        </div>
      </div>
    </div>
  );
}

type EditorTab = 'colors' | 'fonts' | 'button' | 'nav' | 'layout' | 'background' | 'card' | 'announcement' | 'css';

const EDITOR_TABS: { value: EditorTab; label: string; icon: React.ElementType }[] = [
  { value: 'colors', label: '颜色', icon: Palette },
  { value: 'fonts', label: '字体', icon: Type },
  { value: 'button', label: '按钮', icon: MousePointer },
  { value: 'nav', label: '导航', icon: Navigation },
  { value: 'layout', label: '布局', icon: Layout },
  { value: 'background', label: '背景', icon: ImageIcon },
  { value: 'card', label: '产品卡片', icon: ShoppingBag },
  { value: 'announcement', label: '公告栏', icon: Megaphone },
  { value: 'css', label: '自定义 CSS', icon: Code },
];

export function ThemeManagement({ initialThemes }: Props) {
  const router = useRouter();
  const [themeList, setThemeList] = useState(initialThemes);
  const [isPending, startTransition] = useTransition();
  const [editingTheme, setEditingTheme] = useState<ThemeListItem | null>(null);
  const [editConfig, setEditConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [editName, setEditName] = useState('');
  const [activeTab, setActiveTab] = useState<EditorTab>('colors');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPresetIdx, setNewPresetIdx] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ThemeListItem | null>(null);

  function refreshList() {
    router.refresh();
    startTransition(async () => {
      const res = await getThemeListAction();
      if (res.success) setThemeList(res.data);
    });
  }

  function openEdit(theme: ThemeListItem) {
    setEditingTheme(theme);
    setEditName(theme.name);
    const cfg = structuredClone(theme.config);
    setEditConfig({
      ...DEFAULT_THEME_CONFIG,
      ...cfg,
      productCard: { ...DEFAULT_THEME_CONFIG.productCard, ...cfg.productCard },
      announcementBar: { ...DEFAULT_THEME_CONFIG.announcementBar, ...cfg.announcementBar },
      layout: { ...DEFAULT_THEME_CONFIG.layout, ...cfg.layout },
    });
  }

  function handleSave() {
    if (!editingTheme) return;
    startTransition(async () => {
      const res = await updateThemeAction({
        id: editingTheme.id,
        name: editName,
        config: editConfig,
      });
      if (res.success) {
        setEditingTheme(null);
        refreshList();
      }
    });
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const preset = COLOR_PRESETS[newPresetIdx];
    const config: ThemeConfig = { ...DEFAULT_THEME_CONFIG, colors: preset.colors };
    startTransition(async () => {
      const res = await createThemeAction({ name: newName.trim(), config });
      if (res.success) {
        setShowCreate(false);
        setNewName('');
        setNewPresetIdx(0);
        refreshList();
      }
    });
  }

  function handleActivate(id: string) {
    startTransition(async () => {
      const res = await activateThemeAction({ id });
      if (res.success) refreshList();
    });
  }

  function handleDuplicate(theme: ThemeListItem) {
    startTransition(async () => {
      const res = await createThemeAction({
        name: `${theme.name} (副本)`,
        config: theme.config,
      });
      if (res.success) refreshList();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteThemeAction({ id: deleteTarget.id });
      if (res.success) {
        setDeleteTarget(null);
        refreshList();
      }
    });
  }

  function updateColors(key: keyof ThemeColors, value: string) {
    setEditConfig((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  }

  const pc = editConfig.productCard ?? DEFAULT_THEME_CONFIG.productCard;
  const ab = editConfig.announcementBar ?? DEFAULT_THEME_CONFIG.announcementBar;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">主题管理</h1>
          <p className="text-sm text-muted-foreground mt-1">自定义网站外观，无需修改代码</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建主题
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themeList.map((theme) => (
          <div
            key={theme.id}
            className={`rounded-lg border p-4 space-y-3 transition-colors ${
              theme.isActive ? 'border-primary bg-primary/5' : 'bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{theme.name}</h3>
                {theme.isPreset && <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">预设</span>}
              </div>
              {theme.isActive && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" /> 激活中
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {(['primary', 'secondary', 'accent', 'background', 'foreground', 'muted'] as const).map((key) => (
                <div
                  key={key}
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${theme.config.colors[key]})` }}
                  title={COLOR_LABELS[key]}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(theme)}>编辑</Button>
              {!theme.isActive && (
                <Button size="sm" variant="outline" onClick={() => handleActivate(theme.id)} disabled={isPending}>激活</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => handleDuplicate(theme)} disabled={isPending}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {!theme.isPreset && !theme.isActive && (
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(theme)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 主题编辑对话框 */}
      <Dialog open={!!editingTheme} onOpenChange={() => setEditingTheme(null)}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-0">
            <DialogTitle className="flex items-center gap-3">
              编辑主题
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-xs h-8 text-sm" />
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 grid grid-cols-[160px_minmax(300px,420px)_1fr] gap-0">
            {/* 左侧 Tab 导航 */}
            <nav className="flex flex-col gap-0.5 border-r border-border/60 px-2 py-3 overflow-y-auto">
              {EDITOR_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors text-left',
                    activeTab === tab.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* 中间设置面板 */}
            <div className="overflow-y-auto border-r border-border/60 p-4">
              {activeTab === 'colors' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(COLOR_LABELS) as Array<keyof ThemeColors>).map((key) => (
                      <ColorInput key={key} label={COLOR_LABELS[key]} value={editConfig.colors[key]} onChange={(v) => updateColors(key, v)} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'fonts' && (
                <div className="space-y-5">
                  <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                    <p>字体从 <strong>Google Fonts</strong> 实时加载，选择后右侧预览即可看到效果。</p>
                    <p>如需使用自有字体文件，请在「自定义 CSS」标签页中用 <code className="bg-background px-1 rounded">@font-face</code> 声明，然后在此处填写字体名称。</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">正文字体</p>
                    <p className="text-xs text-muted-foreground mb-2">应用于所有正文段落和 UI 元素</p>
                    <FontSelect
                      label="拉丁 / 英文字体"
                      value={editConfig.fonts.latin}
                      onChange={(v) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, latin: v } }))}
                      filterCategories={['sans-serif', 'serif', 'display', 'monospace']}
                    />
                    <div className="mt-3">
                      <FontSelect
                        label="中日韩字体"
                        value={editConfig.fonts.cjk}
                        onChange={(v) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, cjk: v } }))}
                        filterCategories={['cjk']}
                      />
                    </div>
                    <div className="mt-3">
                      <FontSelect
                        label="阿拉伯字体（多语言站点用）"
                        value={editConfig.fonts.arabic}
                        onChange={(v) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, arabic: v } }))}
                        filterCategories={['sans-serif', 'serif']}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-4 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">标题字体</p>
                    <p className="text-xs text-muted-foreground mb-2">h1–h6 独立字体，留空则与正文字体相同（很多品牌选择衬线/展示字体做标题）</p>
                    <FontSelect
                      label="标题字体"
                      value={editConfig.fonts.headingFont ?? ''}
                      onChange={(v) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, headingFont: v || undefined } }))}
                      allowEmpty
                      emptyLabel="（与正文字体相同）"
                    />
                  </div>

                  <div className="border-t border-border/60 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">标题字重</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['400', '500', '600', '700', '800', '900'].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, headingWeight: w } }))}
                            className={`px-2.5 py-1 text-xs rounded border transition-colors ${editConfig.fonts.headingWeight === w ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'}`}
                            style={{ fontWeight: Number(w) }}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">正文字号</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['14px', '15px', '16px', '17px', '18px'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, bodySize: s } }))}
                            className={`px-2.5 py-1 text-xs rounded border transition-colors ${editConfig.fonts.bodySize === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-4">
                    <label className="text-sm font-medium mb-1.5 block">标题字间距</label>
                    <p className="text-xs text-muted-foreground mb-2">调整标题文字之间的间距，负值更紧凑（适合大号标题），正值更舒展（适合展示字体）</p>
                    <div className="flex flex-wrap gap-1.5">
                      {LETTER_SPACING_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, letterSpacing: opt.value } }))}
                          className={`px-2.5 py-1 text-xs rounded border transition-colors ${(editConfig.fonts.letterSpacing ?? 'normal') === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200 space-y-1">
                    <p className="font-medium">如何使用本地字体文件？</p>
                    <p>1. 将 .woff2 字体文件上传到「媒体库」，获取文件 URL</p>
                    <p>2. 在「自定义 CSS」标签页粘贴：</p>
                    <code className="block bg-background/40 rounded p-2 mt-1 text-[10px] whitespace-pre">{`@font-face {
  font-family: 'MyFont';
  src: url('/uploads/myfont.woff2') format('woff2');
  font-weight: 400 700;
  font-display: swap;
}`}</code>
                    <p>3. 回到字体标签页，在拉丁字体下拉中选择任意字体占位，然后在标题字体或正文字体旁直接改 Input 为 <code className="bg-background/40 rounded px-1">MyFont</code>（自定义名称不在下拉列表中，直接输入即可覆盖）</p>
                  </div>
                </div>
              )}

              {activeTab === 'button' && (
                <div className="space-y-4">
                  <SelectGroup label="形状" options={BUTTON_SHAPES} value={editConfig.button.shape} onChange={(v) => setEditConfig((p) => ({ ...p, button: { ...p.button, shape: v } }))} />
                  <SelectGroup label="尺寸" options={BUTTON_SIZES} value={editConfig.button.size} onChange={(v) => setEditConfig((p) => ({ ...p, button: { ...p.button, size: v } }))} />
                  <SelectGroup label="动画效果" options={BUTTON_ANIMATIONS} value={editConfig.button.animation} onChange={(v) => setEditConfig((p) => ({ ...p, button: { ...p.button, animation: v } }))} />
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium mb-1 block">字重</label><Input value={editConfig.button.fontWeight} onChange={(e) => setEditConfig((p) => ({ ...p, button: { ...p.button, fontWeight: e.target.value } }))} placeholder="500" /></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editConfig.button.uppercase} onChange={(e) => setEditConfig((p) => ({ ...p, button: { ...p.button, uppercase: e.target.checked } }))} className="rounded" />大写</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editConfig.button.shadow} onChange={(e) => setEditConfig((p) => ({ ...p, button: { ...p.button, shadow: e.target.checked } }))} className="rounded" />阴影</label>
                  </div>
                </div>
              )}

              {activeTab === 'nav' && (
                <div className="space-y-4">
                  <SelectGroup label="菜单样式" options={NAV_STYLES} value={editConfig.nav.style} onChange={(v) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, style: v } }))} />
                  <SelectGroup label="间距" options={NAV_SPACINGS} value={editConfig.nav.spacing} onChange={(v) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, spacing: v } }))} />
                  <div><label className="text-sm font-medium mb-1 block">字重</label><Input value={editConfig.nav.fontWeight} onChange={(e) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, fontWeight: e.target.value } }))} placeholder="500" /></div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editConfig.nav.uppercase} onChange={(e) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, uppercase: e.target.checked } }))} className="rounded" />大写</label>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <SelectGroup label="Header 样式" options={HEADER_STYLES} value={editConfig.layout.headerStyle} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, headerStyle: v } }))} />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editConfig.layout.headerTransparent} onChange={(e) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, headerTransparent: e.target.checked } }))} className="rounded" />Header 透明</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editConfig.layout.headerBlur ?? true} onChange={(e) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, headerBlur: e.target.checked } }))} className="rounded" />背景模糊</label>
                  </div>
                  <SelectGroup label="Footer 样式" options={FOOTER_STYLES} value={editConfig.layout.footerStyle} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, footerStyle: v } }))} />
                  <SelectGroup label="圆角" options={RADIUS_PRESETS} value={editConfig.layout.radius} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, radius: v } }))} />
                  <SelectGroup label="阴影" options={SHADOW_PRESETS} value={editConfig.layout.shadow} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, shadow: v } }))} />
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium mb-1 block">内容区最大宽度</label><Input value={editConfig.layout.maxWidth} onChange={(e) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, maxWidth: e.target.value } }))} placeholder="1280px" /></div>
                    <div><label className="text-sm font-medium mb-1 block">Logo 高度 (px)</label><Input type="number" min={20} max={200} value={editConfig.layout.logoHeight ?? 44} onChange={(e) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, logoHeight: Number(e.target.value) } }))} /></div>
                  </div>
                </div>
              )}

              {activeTab === 'background' && (
                <div className="space-y-4">
                  <BackgroundEditor label="页面背景" value={editConfig.layout.pageBackground} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, pageBackground: v } }))} />
                  <BackgroundEditor label="Header 背景" value={editConfig.layout.headerBackground} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, headerBackground: v } }))} />
                  <BackgroundEditor label="Footer 背景" value={editConfig.layout.footerBackground} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, footerBackground: v } }))} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">区块默认背景</label>
                    <p className="mb-2 text-xs text-muted-foreground">未单独设置背景的区块将使用此默认值</p>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={editConfig.layout.defaultBlockBackground ?? 'white'}
                      onChange={(e) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, defaultBlockBackground: e.target.value } }))}
                    >
                      <option value="transparent">透明（继承页面背景）</option>
                      <option value="white">白色</option>
                      <option value="gray">灰色</option>
                      <option value="primary">主色调</option>
                      <option value="secondary">次色调</option>
                      <option value="gradient">渐变</option>
                      <option value="dark">深色</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'card' && (
                <div className="space-y-4">
                  <SelectGroup label="图片比例" options={CARD_IMAGE_RATIOS} value={pc.imageRatio} onChange={(v) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, imageRatio: v } }))} />
                  <SelectGroup label="悬停效果" options={CARD_HOVER_EFFECTS} value={pc.hoverEffect} onChange={(v) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, hoverEffect: v } }))} />
                  <SelectGroup label="网格列数" options={GRID_COLUMNS} value={pc.gridColumns} onChange={(v) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, gridColumns: v } }))} />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pc.showSku} onChange={(e) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, showSku: e.target.checked } }))} className="rounded" />显示 SKU</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pc.showDescription} onChange={(e) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, showDescription: e.target.checked } }))} className="rounded" />显示简介</label>
                  </div>
                </div>
              )}

              {activeTab === 'announcement' && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ab.enabled} onChange={(e) => setEditConfig((p) => ({ ...p, announcementBar: { ...p.announcementBar ?? DEFAULT_THEME_CONFIG.announcementBar, enabled: e.target.checked } }))} className="rounded" />启用公告栏</label>
                  {ab.enabled && (
                    <>
                      <p className="text-xs text-muted-foreground">公告栏文本内容请在「网站设置 → 翻译」中编辑（字段：announcementBarText），此处仅设置样式。</p>
                      <ColorInput label="背景色" value={ab.bgColor} onChange={(v) => setEditConfig((p) => ({ ...p, announcementBar: { ...p.announcementBar ?? DEFAULT_THEME_CONFIG.announcementBar, bgColor: v } }))} />
                      <ColorInput label="文字色" value={ab.textColor} onChange={(v) => setEditConfig((p) => ({ ...p, announcementBar: { ...p.announcementBar ?? DEFAULT_THEME_CONFIG.announcementBar, textColor: v } }))} />
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ab.dismissible} onChange={(e) => setEditConfig((p) => ({ ...p, announcementBar: { ...p.announcementBar ?? DEFAULT_THEME_CONFIG.announcementBar, dismissible: e.target.checked } }))} className="rounded" />可关闭</label>
                      <div><label className="text-sm font-medium mb-1 block">链接 URL（可选）</label><Input value={ab.linkUrl ?? ''} onChange={(e) => setEditConfig((p) => ({ ...p, announcementBar: { ...p.announcementBar ?? DEFAULT_THEME_CONFIG.announcementBar, linkUrl: e.target.value || undefined } }))} placeholder="https://..." /></div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'css' && (
                <div className="space-y-3">
                  <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
                    ⚠️ 高级功能：自定义 CSS 会注入到网站前台，仅限有 CSS 经验的用户使用。作用域为 <code>.vt-page-content</code>。
                  </div>
                  <textarea
                    className="w-full h-48 rounded-md border border-border bg-background p-3 font-mono text-xs resize-y"
                    value={editConfig.customCss ?? ''}
                    onChange={(e) => setEditConfig((p) => ({ ...p, customCss: e.target.value }))}
                    placeholder={`.vt-page-content h1 {\n  color: red;\n}`}
                  />
                </div>
              )}
            </div>

            {/* 右侧预览 */}
            <div className="overflow-y-auto bg-card">
              <EnhancedPreview config={editConfig} />
            </div>
          </div>

          <DialogFooter className="shrink-0 px-6 pb-6 pt-3">
            <Button variant="outline" onClick={() => setEditingTheme(null)}>取消</Button>
            <Button onClick={handleSave} disabled={isPending}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建主题对话框 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新建主题</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">主题名称</label>
              <Input placeholder="例：Ocean Blue" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">选择色板</label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setNewPresetIdx(idx)}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                      newPresetIdx === idx
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      {preset.swatches.slice(0, 4).map((hsl, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full border-2 border-background"
                          style={{ backgroundColor: `hsl(${hsl})` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isPending}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">确定要删除主题「{deleteTarget?.name}」吗？此操作不可撤销。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
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
  Eye,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <div>
          <label className="text-sm font-medium mb-1 block">渐变 CSS</label>
          <Input
            value={bg.gradient ?? ''}
            onChange={(e) => onChange({ ...bg, gradient: e.target.value })}
            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
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

function InlinePreview({ config }: { config: ThemeConfig }) {
  const bg = `hsl(${config.colors.background})`;
  const fg = `hsl(${config.colors.foreground})`;
  const primary = `hsl(${config.colors.primary})`;
  const primaryFg = `hsl(${config.colors.primaryForeground})`;
  const muted = `hsl(${config.colors.muted})`;
  const mutedFg = `hsl(${config.colors.mutedForeground})`;
  const accent = `hsl(${config.colors.accent})`;
  const card = `hsl(${config.colors.card})`;
  const cardFg = `hsl(${config.colors.cardForeground})`;
  const border = `hsl(${config.colors.border})`;

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <div className="px-3 py-2 text-xs font-medium bg-muted/50 border-b border-border/60">预览</div>
      <div className="p-4 space-y-4" style={{ backgroundColor: bg, color: fg, fontFamily: `${config.fonts.latin}, sans-serif`, fontSize: config.fonts.bodySize }}>
        <div>
          <h3 style={{ fontWeight: Number(config.fonts.headingWeight) || 700, fontSize: '1.25rem' }}>
            标题文字 Heading
          </h3>
          <p style={{ color: mutedFg }}>正文内容 Body text preview</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            style={{
              backgroundColor: primary,
              color: primaryFg,
              padding: '0.5rem 1rem',
              borderRadius: config.button.shape === 'pill' ? '9999px' : config.button.shape === 'square' ? '0' : config.button.shape === 'soft' ? '0.25rem' : '0.5rem',
              fontSize: '0.875rem',
              fontWeight: Number(config.button.fontWeight) || 500,
              textTransform: config.button.uppercase ? 'uppercase' : undefined,
              letterSpacing: config.button.uppercase ? '0.05em' : undefined,
              border: 'none',
            }}
          >
            按钮 Button
          </button>
          <button
            style={{
              backgroundColor: 'transparent',
              color: fg,
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              border: `1px solid ${border}`,
            }}
          >
            次要 Secondary
          </button>
        </div>

        <div className="flex gap-3">
          {['首页', '产品', '新闻', '联系我们'].map((label) => (
            <span
              key={label}
              style={{
                fontSize: '0.875rem',
                padding: '0.25rem 0.75rem',
                color: mutedFg,
                fontWeight: Number(config.nav.fontWeight) || 500,
                textTransform: config.nav.uppercase ? 'uppercase' : undefined,
                letterSpacing: config.nav.uppercase ? '0.05em' : undefined,
                borderBottom: config.nav.style === 'underline' ? `2px solid ${primary}` : undefined,
                backgroundColor: config.nav.style === 'pill' ? accent : config.nav.style === 'default' ? accent : undefined,
                borderRadius: config.nav.style === 'pill' ? '9999px' : config.nav.style === 'default' ? '0.5rem' : undefined,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div
          className="flex gap-3"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${config.productCard?.gridColumns ?? 3}, 1fr)`,
            gap: '0.5rem',
          }}
        >
          {[1, 2, 3].slice(0, config.productCard?.gridColumns ?? 3).map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: card,
                color: cardFg,
                borderRadius: '0.75rem',
                border: `1px solid ${border}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ aspectRatio: config.productCard?.imageRatio?.replace(':', '/') ?? '4/3', backgroundColor: muted }} />
              <div style={{ padding: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>产品名称</div>
                {config.productCard?.showSku !== false && (
                  <div style={{ fontSize: '0.625rem', color: mutedFg }}>SKU-001</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThemeManagement({ initialThemes }: Props) {
  const [themeList, setThemeList] = useState(initialThemes);
  const [isPending, startTransition] = useTransition();
  const [editingTheme, setEditingTheme] = useState<ThemeListItem | null>(null);
  const [editConfig, setEditConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [editName, setEditName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ThemeListItem | null>(null);

  function refreshList() {
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
    startTransition(async () => {
      const res = await createThemeAction({ name: newName.trim() });
      if (res.success) {
        setShowCreate(false);
        setNewName('');
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑主题</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">主题名称</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              <Tabs defaultValue="colors">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                  <TabsTrigger value="colors" className="gap-1"><Palette className="h-3.5 w-3.5" />颜色</TabsTrigger>
                  <TabsTrigger value="fonts" className="gap-1"><Type className="h-3.5 w-3.5" />字体</TabsTrigger>
                  <TabsTrigger value="button" className="gap-1"><MousePointer className="h-3.5 w-3.5" />按钮</TabsTrigger>
                  <TabsTrigger value="nav" className="gap-1"><Navigation className="h-3.5 w-3.5" />导航</TabsTrigger>
                  <TabsTrigger value="layout" className="gap-1"><Layout className="h-3.5 w-3.5" />布局</TabsTrigger>
                  <TabsTrigger value="background" className="gap-1"><ImageIcon className="h-3.5 w-3.5" />背景</TabsTrigger>
                  <TabsTrigger value="card" className="gap-1"><ShoppingBag className="h-3.5 w-3.5" />产品卡片</TabsTrigger>
                  <TabsTrigger value="announcement" className="gap-1"><Megaphone className="h-3.5 w-3.5" />公告栏</TabsTrigger>
                  <TabsTrigger value="css" className="gap-1"><Code className="h-3.5 w-3.5" />自定义 CSS</TabsTrigger>
                </TabsList>

                {/* 颜色 */}
                <TabsContent value="colors" className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(COLOR_LABELS) as Array<keyof ThemeColors>).map((key) => (
                      <ColorInput key={key} label={COLOR_LABELS[key]} value={editConfig.colors[key]} onChange={(v) => updateColors(key, v)} />
                    ))}
                  </div>
                </TabsContent>

                {/* 字体 */}
                <TabsContent value="fonts" className="space-y-4 pt-4">
                  <div><label className="text-sm font-medium mb-1 block">拉丁字体</label><Input value={editConfig.fonts.latin} onChange={(e) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, latin: e.target.value } }))} /></div>
                  <div><label className="text-sm font-medium mb-1 block">CJK 字体</label><Input value={editConfig.fonts.cjk} onChange={(e) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, cjk: e.target.value } }))} /></div>
                  <div><label className="text-sm font-medium mb-1 block">阿拉伯字体</label><Input value={editConfig.fonts.arabic} onChange={(e) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, arabic: e.target.value } }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium mb-1 block">标题字重</label><Input value={editConfig.fonts.headingWeight} onChange={(e) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, headingWeight: e.target.value } }))} placeholder="700" /></div>
                    <div><label className="text-sm font-medium mb-1 block">正文字号</label><Input value={editConfig.fonts.bodySize} onChange={(e) => setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, bodySize: e.target.value } }))} placeholder="16px" /></div>
                  </div>
                </TabsContent>

                {/* 按钮 */}
                <TabsContent value="button" className="space-y-4 pt-4">
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
                </TabsContent>

                {/* 导航 */}
                <TabsContent value="nav" className="space-y-4 pt-4">
                  <SelectGroup label="菜单样式" options={NAV_STYLES} value={editConfig.nav.style} onChange={(v) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, style: v } }))} />
                  <SelectGroup label="间距" options={NAV_SPACINGS} value={editConfig.nav.spacing} onChange={(v) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, spacing: v } }))} />
                  <div><label className="text-sm font-medium mb-1 block">字重</label><Input value={editConfig.nav.fontWeight} onChange={(e) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, fontWeight: e.target.value } }))} placeholder="500" /></div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editConfig.nav.uppercase} onChange={(e) => setEditConfig((p) => ({ ...p, nav: { ...p.nav, uppercase: e.target.checked } }))} className="rounded" />大写</label>
                </TabsContent>

                {/* 布局 */}
                <TabsContent value="layout" className="space-y-4 pt-4">
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
                    <div><label className="text-sm font-medium mb-1 block">Logo 高度 (px)</label><Input type="number" min={20} max={120} value={editConfig.layout.logoHeight ?? 36} onChange={(e) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, logoHeight: Number(e.target.value) } }))} /></div>
                  </div>
                </TabsContent>

                {/* 背景 */}
                <TabsContent value="background" className="space-y-4 pt-4">
                  <BackgroundEditor label="页面背景" value={editConfig.layout.pageBackground} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, pageBackground: v } }))} />
                  <BackgroundEditor label="Header 背景" value={editConfig.layout.headerBackground} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, headerBackground: v } }))} />
                  <BackgroundEditor label="Footer 背景" value={editConfig.layout.footerBackground} onChange={(v) => setEditConfig((p) => ({ ...p, layout: { ...p.layout, footerBackground: v } }))} />
                </TabsContent>

                {/* 产品卡片 */}
                <TabsContent value="card" className="space-y-4 pt-4">
                  <SelectGroup label="图片比例" options={CARD_IMAGE_RATIOS} value={pc.imageRatio} onChange={(v) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, imageRatio: v } }))} />
                  <SelectGroup label="悬停效果" options={CARD_HOVER_EFFECTS} value={pc.hoverEffect} onChange={(v) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, hoverEffect: v } }))} />
                  <SelectGroup label="网格列数" options={GRID_COLUMNS} value={pc.gridColumns} onChange={(v) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, gridColumns: v } }))} />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pc.showSku} onChange={(e) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, showSku: e.target.checked } }))} className="rounded" />显示 SKU</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pc.showDescription} onChange={(e) => setEditConfig((p) => ({ ...p, productCard: { ...p.productCard ?? DEFAULT_THEME_CONFIG.productCard, showDescription: e.target.checked } }))} className="rounded" />显示简介</label>
                  </div>
                </TabsContent>

                {/* 公告栏 */}
                <TabsContent value="announcement" className="space-y-4 pt-4">
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
                </TabsContent>

                {/* 自定义 CSS */}
                <TabsContent value="css" className="space-y-3 pt-4">
                  <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
                    ⚠️ 高级功能：自定义 CSS 会注入到网站前台，仅限有 CSS 经验的用户使用。作用域为 <code>.vt-page-content</code>。
                  </div>
                  <textarea
                    className="w-full h-48 rounded-md border border-border bg-background p-3 font-mono text-xs resize-y"
                    value={editConfig.customCss ?? ''}
                    onChange={(e) => setEditConfig((p) => ({ ...p, customCss: e.target.value }))}
                    placeholder={`.vt-page-content h1 {\n  color: red;\n}`}
                  />
                </TabsContent>
              </Tabs>

              {/* 侧边预览 */}
              <div className="hidden lg:block sticky top-4">
                <InlinePreview config={editConfig} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTheme(null)}>取消</Button>
            <Button onClick={handleSave} disabled={isPending}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建主题对话框 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建主题</DialogTitle></DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1 block">主题名称</label>
            <Input placeholder="例：Ocean Blue" value={newName} onChange={(e) => setNewName(e.target.value)} />
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

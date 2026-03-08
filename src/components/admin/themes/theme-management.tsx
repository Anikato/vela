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
  type ButtonShape,
  type ButtonSize,
  type ButtonAnimation,
  type NavStyle,
  type NavSpacing,
  type HeaderStyle,
  type FooterStyle,
  type RadiusPreset,
  type ShadowPreset,
} from '@/types/theme';
import type { ThemeListItem } from '@/server/services/theme.service';

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

function SelectGroup<T extends string>({
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
            key={opt.value}
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
    setEditConfig(structuredClone(theme.config));
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
    setEditConfig((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  }

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

      {/* 主题卡片网格 */}
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
                {theme.isPreset && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">预设</span>
                )}
              </div>
              {theme.isActive && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  激活中
                </span>
              )}
            </div>

            {/* 颜色预览 */}
            <div className="flex gap-1">
              {(['primary', 'secondary', 'accent', 'background', 'foreground', 'muted'] as const).map(
                (key) => (
                  <div
                    key={key}
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: `hsl(${theme.config.colors[key]})` }}
                    title={COLOR_LABELS[key]}
                  />
                ),
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(theme)}>
                编辑
              </Button>
              {!theme.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleActivate(theme.id)}
                  disabled={isPending}
                >
                  激活
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDuplicate(theme)}
                disabled={isPending}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {!theme.isPreset && !theme.isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(theme)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 主题编辑对话框 */}
      <Dialog open={!!editingTheme} onOpenChange={() => setEditingTheme(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑主题</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">主题名称</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <Tabs defaultValue="colors">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="colors" className="gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  颜色
                </TabsTrigger>
                <TabsTrigger value="fonts" className="gap-1.5">
                  <Type className="h-3.5 w-3.5" />
                  字体
                </TabsTrigger>
                <TabsTrigger value="button" className="gap-1.5">
                  <MousePointer className="h-3.5 w-3.5" />
                  按钮
                </TabsTrigger>
                <TabsTrigger value="nav" className="gap-1.5">
                  <Navigation className="h-3.5 w-3.5" />
                  导航
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-1.5">
                  <Layout className="h-3.5 w-3.5" />
                  布局
                </TabsTrigger>
              </TabsList>

              {/* 颜色 Tab */}
              <TabsContent value="colors" className="space-y-3 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(COLOR_LABELS) as Array<keyof ThemeColors>).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded border border-border shrink-0"
                        style={{ backgroundColor: `hsl(${editConfig.colors[key]})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <label className="text-xs text-muted-foreground block">
                          {COLOR_LABELS[key]}
                        </label>
                        <Input
                          value={editConfig.colors[key]}
                          onChange={(e) => updateColors(key, e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="H S% L%"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* 字体 Tab */}
              <TabsContent value="fonts" className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">拉丁字体</label>
                  <Input
                    value={editConfig.fonts.latin}
                    onChange={(e) =>
                      setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, latin: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">CJK 字体</label>
                  <Input
                    value={editConfig.fonts.cjk}
                    onChange={(e) =>
                      setEditConfig((p) => ({ ...p, fonts: { ...p.fonts, cjk: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">阿拉伯字体</label>
                  <Input
                    value={editConfig.fonts.arabic}
                    onChange={(e) =>
                      setEditConfig((p) => ({
                        ...p,
                        fonts: { ...p.fonts, arabic: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">标题字重</label>
                    <Input
                      value={editConfig.fonts.headingWeight}
                      onChange={(e) =>
                        setEditConfig((p) => ({
                          ...p,
                          fonts: { ...p.fonts, headingWeight: e.target.value },
                        }))
                      }
                      placeholder="700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">正文字号</label>
                    <Input
                      value={editConfig.fonts.bodySize}
                      onChange={(e) =>
                        setEditConfig((p) => ({
                          ...p,
                          fonts: { ...p.fonts, bodySize: e.target.value },
                        }))
                      }
                      placeholder="16px"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 按钮 Tab */}
              <TabsContent value="button" className="space-y-4 pt-4">
                <SelectGroup
                  label="形状"
                  options={BUTTON_SHAPES}
                  value={editConfig.button.shape}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, button: { ...p.button, shape: v } }))
                  }
                />
                <SelectGroup
                  label="尺寸"
                  options={BUTTON_SIZES}
                  value={editConfig.button.size}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, button: { ...p.button, size: v } }))
                  }
                />
                <SelectGroup
                  label="动画效果"
                  options={BUTTON_ANIMATIONS}
                  value={editConfig.button.animation}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, button: { ...p.button, animation: v } }))
                  }
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editConfig.button.uppercase}
                      onChange={(e) =>
                        setEditConfig((p) => ({
                          ...p,
                          button: { ...p.button, uppercase: e.target.checked },
                        }))
                      }
                      className="rounded"
                    />
                    大写
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editConfig.button.shadow}
                      onChange={(e) =>
                        setEditConfig((p) => ({
                          ...p,
                          button: { ...p.button, shadow: e.target.checked },
                        }))
                      }
                      className="rounded"
                    />
                    阴影
                  </label>
                </div>
              </TabsContent>

              {/* 导航 Tab */}
              <TabsContent value="nav" className="space-y-4 pt-4">
                <SelectGroup
                  label="菜单样式"
                  options={NAV_STYLES}
                  value={editConfig.nav.style}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, nav: { ...p.nav, style: v } }))
                  }
                />
                <SelectGroup
                  label="间距"
                  options={NAV_SPACINGS}
                  value={editConfig.nav.spacing}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, nav: { ...p.nav, spacing: v } }))
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editConfig.nav.uppercase}
                    onChange={(e) =>
                      setEditConfig((p) => ({
                        ...p,
                        nav: { ...p.nav, uppercase: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  大写
                </label>
              </TabsContent>

              {/* 布局 Tab */}
              <TabsContent value="layout" className="space-y-4 pt-4">
                <SelectGroup
                  label="Header 样式"
                  options={HEADER_STYLES}
                  value={editConfig.layout.headerStyle}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, layout: { ...p.layout, headerStyle: v } }))
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editConfig.layout.headerTransparent}
                    onChange={(e) =>
                      setEditConfig((p) => ({
                        ...p,
                        layout: { ...p.layout, headerTransparent: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  Header 透明（适合 Hero 大图首屏）
                </label>
                <SelectGroup
                  label="Footer 样式"
                  options={FOOTER_STYLES}
                  value={editConfig.layout.footerStyle}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, layout: { ...p.layout, footerStyle: v } }))
                  }
                />
                <SelectGroup
                  label="圆角"
                  options={RADIUS_PRESETS}
                  value={editConfig.layout.radius}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, layout: { ...p.layout, radius: v } }))
                  }
                />
                <SelectGroup
                  label="阴影"
                  options={SHADOW_PRESETS}
                  value={editConfig.layout.shadow}
                  onChange={(v) =>
                    setEditConfig((p) => ({ ...p, layout: { ...p.layout, shadow: v } }))
                  }
                />
                <div>
                  <label className="text-sm font-medium mb-1 block">内容区最大宽度</label>
                  <Input
                    value={editConfig.layout.maxWidth}
                    onChange={(e) =>
                      setEditConfig((p) => ({
                        ...p,
                        layout: { ...p.layout, maxWidth: e.target.value },
                      }))
                    }
                    placeholder="1280px"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTheme(null)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建主题对话框 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建主题</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1 block">主题名称</label>
            <Input
              placeholder="例：Ocean Blue"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isPending}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除主题「{deleteTarget?.name}」吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

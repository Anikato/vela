'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

/* ------------------------------------------------------------------
 * 按区块类型渲染对应的可视化配置表单。
 * 运营人员不再需要手写 JSON，只需填写友好的表单字段。
 * 支持降级：不认识的类型仍展示 JSON 文本框。
 * ----------------------------------------------------------------*/

interface BlockConfigFormProps {
  type: string;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}

/* ---- 辅助函数 ---- */
function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/* ---- 列数选择器（多个区块共用） ---- */
function ColumnsSelect({
  value,
  onChange,
  options = [2, 3, 4],
  defaultValue = 3,
  disabled,
}: {
  value: unknown;
  onChange: (v: number) => void;
  options?: number[];
  defaultValue?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">列数</label>
      <Select value={String(num(value, defaultValue))} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} 列
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---- 数量限制输入 ---- */
function LimitInput({
  value,
  onChange,
  min = 1,
  max = 24,
  defaultValue = 6,
  disabled,
  label = '显示数量',
}: {
  value: unknown;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  defaultValue?: number;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        type="number"
        min={min}
        max={max}
        value={num(value, defaultValue)}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.floor(n))));
        }}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        范围 {min}–{max}，默认 {defaultValue}
      </p>
    </div>
  );
}

/* ==================================================================
 * 各区块类型的配置表单
 * ================================================================*/

function ProductShowcaseConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <LimitInput
        value={value.limit}
        onChange={(v) => onChange({ ...value, limit: v })}
        disabled={disabled}
      />
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">分类 Slug（可选）</label>
        <Input
          placeholder="例如：pumps"
          value={str(value.category_slug)}
          onChange={(e) => onChange({ ...value, category_slug: e.target.value || undefined })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">按分类筛选产品</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">标签 Slug（可选）</label>
        <Input
          placeholder="例如：featured"
          value={str(value.tag_slug)}
          onChange={(e) => onChange({ ...value, tag_slug: e.target.value || undefined })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">按标签筛选产品</p>
      </div>
    </div>
  );
}

function NewsShowcaseConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <LimitInput
        value={value.limit}
        onChange={(v) => onChange({ ...value, limit: v })}
        disabled={disabled}
      />
      <ColumnsSelect
        value={value.columns}
        onChange={(v) => onChange({ ...value, columns: v })}
        disabled={disabled}
      />
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">布局方式</label>
        <Select value={str(value.layout, 'grid')} onValueChange={(v) => onChange({ ...value, layout: v })} disabled={disabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">网格（Grid）</SelectItem>
            <SelectItem value="list">列表（List）</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CategoryNavConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LimitInput
        value={value.limit}
        onChange={(v) => onChange({ ...value, limit: v })}
        max={50}
        defaultValue={20}
        disabled={disabled}
      />
      <ColumnsSelect
        value={value.columns}
        onChange={(v) => onChange({ ...value, columns: v })}
        options={[2, 3, 4, 5, 6]}
        defaultValue={4}
        disabled={disabled}
      />
    </div>
  );
}

function FeatureGridConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ColumnsSelect
        value={value.columns}
        onChange={(v) => onChange({ ...value, columns: v })}
        disabled={disabled}
      />
    </div>
  );
}

function ImageGalleryConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ColumnsSelect
        value={value.columns}
        onChange={(v) => onChange({ ...value, columns: v })}
        disabled={disabled}
      />
    </div>
  );
}

function TeamConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ColumnsSelect
        value={value.columns}
        onChange={(v) => onChange({ ...value, columns: v })}
        options={[2, 3, 4, 5, 6]}
        defaultValue={4}
        disabled={disabled}
      />
    </div>
  );
}

function TestimonialsConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ColumnsSelect
        value={value.columns}
        onChange={(v) => onChange({ ...value, columns: v })}
        disabled={disabled}
      />
    </div>
  );
}

function TwoColumnConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Switch
          checked={bool(value.reversed)}
          onCheckedChange={(v) => onChange({ ...value, reversed: v })}
          disabled={disabled}
        />
        图文反转（图片在右，文字在左）
      </label>
      <p className="text-xs text-muted-foreground">默认：图片在左，文字在右</p>
    </div>
  );
}

function CarouselBannerConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">自动播放间隔（毫秒）</label>
        <Input
          type="number"
          min={1000}
          max={30000}
          step={500}
          value={num(value.autoplay_ms, 5000)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange({ ...value, autoplay_ms: Math.max(1000, Math.min(30000, n)) });
          }}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">默认 5000ms（5 秒），范围 1000–30000</p>
      </div>
    </div>
  );
}

function VideoEmbedConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground">视频 URL</label>
        <Input
          placeholder="YouTube 或 Vimeo 链接"
          value={str(value.video_url)}
          onChange={(e) => onChange({ ...value, video_url: e.target.value })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          支持 YouTube、Vimeo 链接，自动解析为嵌入播放器
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">宽高比</label>
        <Select value={str(value.aspect_ratio, '16/9')} onValueChange={(v) => onChange({ ...value, aspect_ratio: v })} disabled={disabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="16/9">16:9（默认）</SelectItem>
            <SelectItem value="4/3">4:3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function PartnerLogosConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ColumnsSelect
        value={value.columns}
        onChange={(v) => onChange({ ...value, columns: v })}
        options={[3, 4, 5, 6]}
        defaultValue={5}
        disabled={disabled}
      />
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Switch
            checked={bool(value.scrolling)}
            onCheckedChange={(v) => onChange({ ...value, scrolling: v })}
            disabled={disabled}
          />
          自动滚动
        </label>
        <p className="text-xs text-muted-foreground">启用后 Logo 会无限循环滚动</p>
      </div>
    </div>
  );
}

function CustomHtmlConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">自定义 HTML 代码</label>
      <textarea
        rows={10}
        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
        value={str(value.html)}
        onChange={(e) => onChange({ ...value, html: e.target.value })}
        disabled={disabled}
        placeholder="<div>自定义内容</div>"
      />
      <p className="text-xs text-muted-foreground">
        将原样渲染在页面中，请确保 HTML 安全且合规
      </p>
    </div>
  );
}

/* ==================================================================
 * 配置表单注册表 → 将 type 映射到表单组件
 * ================================================================*/

const configFormRegistry: Record<
  string,
  React.ComponentType<Omit<BlockConfigFormProps, 'type'>>
> = {
  product_showcase: ProductShowcaseConfig,
  news_showcase: NewsShowcaseConfig,
  category_nav: CategoryNavConfig,
  feature_grid: FeatureGridConfig,
  image_gallery: ImageGalleryConfig,
  team: TeamConfig,
  testimonials: TestimonialsConfig,
  two_column: TwoColumnConfig,
  carousel_banner: CarouselBannerConfig,
  video_embed: VideoEmbedConfig,
  partner_logos: PartnerLogosConfig,
  custom_html: CustomHtmlConfig,
};

/* 没有配置项的区块类型 */
const noConfigTypes = new Set([
  'hero',
  'rich_text',
  'cta',
  'stats',
  'faq',
  'timeline',
  'contact_form',
]);

/* ---- 通用外观配置（所有区块共享） ---- */
function CommonAppearanceConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">外观设置</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">背景色</label>
          <Select value={str(value.background, 'white')} onValueChange={(v) => onChange({ ...value, background: v })} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">透明（显示网站背景）</SelectItem>
              <SelectItem value="white">白色</SelectItem>
              <SelectItem value="gray">浅灰</SelectItem>
              <SelectItem value="primary">主题色</SelectItem>
              <SelectItem value="secondary">副色</SelectItem>
              <SelectItem value="gradient">渐变</SelectItem>
              <SelectItem value="dark">深色</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">容器宽度</label>
          <Select value={str(value.container_width, 'default')} onValueChange={(v) => onChange({ ...value, container_width: v })} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="xs">超窄 (672px)</SelectItem>
              <SelectItem value="narrow">窄 (768px)</SelectItem>
              <SelectItem value="medium">中 (896px)</SelectItem>
              <SelectItem value="default">默认 (1024px)</SelectItem>
              <SelectItem value="wide">宽 (跟随主题)</SelectItem>
              <SelectItem value="extra-wide">超宽 (1400px)</SelectItem>
              <SelectItem value="full">全宽</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
          {str(value.container_width, 'default') === 'custom' && (
            <Input
              placeholder="例：1200px"
              value={str(value.container_width_custom, '')}
              onChange={(e) => onChange({ ...value, container_width_custom: e.target.value })}
              disabled={disabled}
              className="mt-1.5"
            />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">上间距</label>
          <Select value={str(value.padding_top, 'md')} onValueChange={(v) => onChange({ ...value, padding_top: v })} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              <SelectItem value="sm">小</SelectItem>
              <SelectItem value="md">中（默认）</SelectItem>
              <SelectItem value="lg">大</SelectItem>
              <SelectItem value="xl">特大</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">下间距</label>
          <Select value={str(value.padding_bottom, 'md')} onValueChange={(v) => onChange({ ...value, padding_bottom: v })} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              <SelectItem value="sm">小</SelectItem>
              <SelectItem value="md">中（默认）</SelectItem>
              <SelectItem value="lg">大</SelectItem>
              <SelectItem value="xl">特大</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground">背景图片 URL（可选）</label>
          <Input
            placeholder="如：/uploads/bg.jpg 或 https://..."
            value={str(value.background_image)}
            onChange={(e) => onChange({ ...value, background_image: e.target.value || undefined })}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">设置后将覆盖背景色，内容显示在图片之上</p>
        </div>
        {str(value.background_image) && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">遮罩层不透明度 (%)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={num(value.overlay_opacity, 40)}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onChange({ ...value, overlay_opacity: Math.max(0, Math.min(100, n)) });
              }}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">0 = 无遮罩，100 = 全黑</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function BlockConfigForm({ type, value, onChange, disabled }: BlockConfigFormProps) {
  const FormComponent = configFormRegistry[type];

  return (
    <div className="space-y-6">
      {/* Type-specific config */}
      {FormComponent && (
        <div className="space-y-2">
          <label className="text-sm font-medium">区块配置</label>
          <FormComponent value={value} onChange={onChange} disabled={disabled} />
        </div>
      )}

      {!FormComponent && !noConfigTypes.has(type) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">配置 JSON（高级）</label>
          <textarea
            rows={6}
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  onChange(parsed);
                }
              } catch {
                /* JSON not valid yet */
              }
            }}
            disabled={disabled}
          />
        </div>
      )}

      {/* Common appearance config for all types */}
      <CommonAppearanceConfig value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

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
    <div className="space-y-4">
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
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">图片轮播间隔（毫秒，0 = 不自动播放）</label>
        <Input
          type="number"
          min={0}
          max={30000}
          step={500}
          value={num(value.image_autoplay_ms, 4000)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange({ ...value, image_autoplay_ms: Math.max(0, Math.min(30000, n)) });
          }}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">有多张侧栏图片时生效，0 表示禁用自动轮播</p>
      </div>
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

function GoogleMapConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-sm font-medium">Google Maps 嵌入 URL</label>
        <Input
          placeholder="https://www.google.com/maps/embed?pb=..."
          value={str(value.embed_url, '')}
          onChange={(e) => onChange({ ...value, embed_url: e.target.value })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">在 Google Maps 中点击「分享」→「嵌入地图」→ 复制 src 链接</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">地图高度</label>
        <Input
          placeholder="450px"
          value={str(value.map_height, '450px')}
          onChange={(e) => onChange({ ...value, map_height: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">圆角</label>
        <Input
          placeholder="12px"
          value={str(value.border_radius, '12px')}
          onChange={(e) => onChange({ ...value, border_radius: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ImageMarqueeConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">滚动速度 (秒)</label>
        <Input
          type="number"
          min={5}
          max={120}
          value={num(value.scroll_speed, 30)}
          onChange={(e) => onChange({ ...value, scroll_speed: Number(e.target.value) })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">完成一轮滚动需要的秒数，数值越大越慢</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">图片高度</label>
        <Input
          placeholder="200px"
          value={str(value.image_height, '200px')}
          onChange={(e) => onChange({ ...value, image_height: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">滚动方向</label>
        <Select value={str(value.direction, 'left')} onValueChange={(v) => onChange({ ...value, direction: v })} disabled={disabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">向左</SelectItem>
            <SelectItem value="right">向右</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 pt-5">
        <Switch
          checked={value.pause_on_hover !== false}
          onCheckedChange={(v) => onChange({ ...value, pause_on_hover: v })}
          disabled={disabled}
        />
        <label className="text-sm">鼠标悬停暂停</label>
      </div>
    </div>
  );
}

function VideoGalleryConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">布局</label>
        <Select value={str(value.layout, 'video_left')} onValueChange={(v) => onChange({ ...value, layout: v })} disabled={disabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="video_left">视频在左 | 列表在右</SelectItem>
            <SelectItem value="video_right">列表在左 | 视频在右</SelectItem>
          </SelectContent>
        </Select>
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
  google_map: GoogleMapConfig,
  image_marquee: ImageMarqueeConfig,
  video_gallery: VideoGalleryConfig,
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

/* ---- 主题色选择器（16 色 CSS 变量 + 自定义 hex） ---- */
const THEME_COLOR_OPTIONS = [
  { value: 'default', label: '默认（跟随主题）' },
  { value: 'foreground', label: '前景色' },
  { value: 'primary', label: '主色' },
  { value: 'primary-foreground', label: '主色前景' },
  { value: 'secondary', label: '次要色' },
  { value: 'secondary-foreground', label: '次要色前景' },
  { value: 'accent', label: '强调色' },
  { value: 'accent-foreground', label: '强调色前景' },
  { value: 'muted-foreground', label: '柔和色前景（浅灰）' },
  { value: 'destructive', label: '错误色' },
  { value: 'white', label: '白色（固定）' },
  { value: 'custom', label: '自定义颜色' },
] as const;

function ThemeColorSelect({
  label,
  configKey,
  customKey,
  defaultColor = 'default',
  value: config,
  onChange,
  disabled,
  extraOptions,
}: {
  label: string;
  configKey: string;
  customKey: string;
  defaultColor?: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  disabled?: boolean;
  extraOptions?: Array<{ value: string; label: string }>;
}) {
  const current = str(config[configKey], defaultColor);
  const allOptions = extraOptions ? [...extraOptions, ...THEME_COLOR_OPTIONS] : THEME_COLOR_OPTIONS;
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Select value={current} onValueChange={(v) => onChange({ ...config, [configKey]: v })} disabled={disabled}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {allOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={str(config[customKey], '#000000')}
            onChange={(e) => onChange({ ...config, [customKey]: e.target.value })}
            disabled={disabled}
            className="h-8 w-10 cursor-pointer rounded border border-input"
          />
          <Input
            placeholder="#000000"
            value={str(config[customKey], '')}
            onChange={(e) => onChange({ ...config, [customKey]: e.target.value })}
            disabled={disabled}
            className="font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}

/* ---- 字号选择器（预设 + 自定义 px） ---- */
function SizeSelect({
  label,
  configKey,
  customKey,
  defaultSize,
  options,
  value: config,
  onChange,
  disabled,
}: {
  label: string;
  configKey: string;
  customKey: string;
  defaultSize: string;
  options: Array<{ value: string; label: string }>;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const current = str(config[configKey], defaultSize);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Select value={current} onValueChange={(v) => onChange({ ...config, [configKey]: v })} disabled={disabled}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
          <SelectItem value="custom">自定义大小</SelectItem>
        </SelectContent>
      </Select>
      {current === 'custom' && (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={8}
            max={200}
            placeholder="20"
            value={num(config[customKey], 20)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 8) onChange({ ...config, [customKey]: n });
            }}
            disabled={disabled}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">px</span>
        </div>
      )}
    </div>
  );
}

/* ---- 通用外观配置（所有区块共享） ---- */
function CommonAppearanceConfig({ value, onChange, disabled }: Omit<BlockConfigFormProps, 'type'>) {
  const titleSize = str(value.text_title_size, 'default');
  const subtitleSize = str(value.text_subtitle_size, 'default');
  const dividerWidth = str(value.text_divider_width, 'md');

  return (
    <div className="space-y-6">
      {/* 文字样式 */}
      <div className="space-y-4">
        <p className="text-sm font-medium">文字样式</p>

        {/* 字号 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SizeSelect
            label="标题字号"
            configKey="text_title_size"
            customKey="text_title_size_custom"
            defaultSize="default"
            options={[
              { value: 'default', label: '默认（跟随主题）' },
              { value: 'sm', label: '小（xl/2xl/3xl）' },
              { value: 'md', label: '中（2xl/3xl/4xl）' },
              { value: 'lg', label: '大（3xl/4xl/5xl）' },
              { value: 'xl', label: '特大（4xl/5xl/6xl）' },
            ]}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
          <SizeSelect
            label="副标题字号"
            configKey="text_subtitle_size"
            customKey="text_subtitle_size_custom"
            defaultSize="default"
            options={[
              { value: 'default', label: '默认（跟随主题）' },
              { value: 'sm', label: '小（base）' },
              { value: 'md', label: '中（lg）' },
              { value: 'lg', label: '大（xl）' },
            ]}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        </div>

        {/* 行高 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">行高</label>
          <Select
            value={str(value.text_line_height, 'normal')}
            onValueChange={(v) => onChange({ ...value, text_line_height: v })}
            disabled={disabled}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tight">紧凑（tight）</SelectItem>
              <SelectItem value="normal">正常（默认）</SelectItem>
              <SelectItem value="relaxed">宽松（relaxed）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 颜色 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ThemeColorSelect
            label="标题颜色"
            configKey="text_title_color"
            customKey="text_title_color_custom"
            defaultColor="default"
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
          <ThemeColorSelect
            label="副标题颜色"
            configKey="text_subtitle_color"
            customKey="text_subtitle_color_custom"
            defaultColor="muted-foreground"
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        </div>

        {/* 装饰条（跟随标题显示） */}
        <div className="rounded-md border border-border/60 p-3 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch
              checked={value.text_divider !== false}
              onCheckedChange={(v) => onChange({ ...value, text_divider: v })}
              disabled={disabled}
            />
            标题下方显示装饰条（跟随标题出现）
          </label>
          {value.text_divider !== false && (
            <div className="grid gap-3 sm:grid-cols-2 pl-8">
              {/* 装饰条宽度 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">装饰条长度</label>
                <Select
                  value={dividerWidth}
                  onValueChange={(v) => onChange({ ...value, text_divider_width: v })}
                  disabled={disabled}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xs">极短（32px）</SelectItem>
                    <SelectItem value="sm">短（40px）</SelectItem>
                    <SelectItem value="md">中（56px，默认）</SelectItem>
                    <SelectItem value="lg">长（80px）</SelectItem>
                    <SelectItem value="full">撑满容器</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
                {dividerWidth === 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={8}
                      max={800}
                      placeholder="56"
                      value={num(value.text_divider_width_custom, 56)}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 8) onChange({ ...value, text_divider_width_custom: n });
                      }}
                      disabled={disabled}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                  </div>
                )}
              </div>
              {/* 装饰条颜色 */}
              <ThemeColorSelect
                label="装饰条颜色"
                configKey="text_divider_color"
                customKey="text_divider_color_custom"
                defaultColor="title"
                extraOptions={[{ value: 'title', label: '跟随标题颜色（默认）' }]}
                value={value}
                onChange={onChange}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/40" />
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
              <SelectItem value="default">默认 (跟随主题)</SelectItem>
              <SelectItem value="wide">宽 (1280px)</SelectItem>
              <SelectItem value="extra-wide">超宽 (1400px)</SelectItem>
              <SelectItem value="1600">1600px</SelectItem>
              <SelectItem value="1800">1800px</SelectItem>
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

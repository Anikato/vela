/**
 * 区块文字样式配置工具
 *
 * 从 section.config（JSONB）中读取用户配置的文字样式，
 * 转换为 Tailwind 类名和 inline style 对象，供各区块前端组件使用。
 *
 * 所有配置项均有合理默认值，确保未配置时与原始样式一致。
 * 配置键以 text_ 前缀区分，避免与其他区块专属配置冲突。
 */

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ─── 颜色映射 ───

const TEXT_COLOR_MAP: Record<string, string> = {
  foreground: 'text-foreground',
  primary: 'text-primary',
  'primary-foreground': 'text-primary-foreground',
  secondary: 'text-secondary',
  'secondary-foreground': 'text-secondary-foreground',
  accent: 'text-accent',
  'accent-foreground': 'text-accent-foreground',
  'muted-foreground': 'text-muted-foreground',
  destructive: 'text-destructive',
  white: 'text-white',
};

const BG_COLOR_MAP: Record<string, string> = {
  foreground: 'bg-foreground',
  primary: 'bg-primary',
  'primary-foreground': 'bg-primary-foreground',
  secondary: 'bg-secondary',
  'secondary-foreground': 'bg-secondary-foreground',
  accent: 'bg-accent',
  'accent-foreground': 'bg-accent-foreground',
  'muted-foreground': 'bg-muted-foreground',
  destructive: 'bg-destructive',
  white: 'bg-white',
};

function resolveColor(
  key: string,
  customValue: string,
  type: 'text' | 'bg',
): { className: string; style?: React.CSSProperties } {
  if (key === 'default') return { className: '' };
  if (key === 'custom') {
    const prop = type === 'text' ? 'color' : 'backgroundColor';
    return { className: '', style: { [prop]: customValue || undefined } };
  }
  const map = type === 'text' ? TEXT_COLOR_MAP : BG_COLOR_MAP;
  return { className: map[key] ?? '' };
}

// ─── 字号映射 ───

const TITLE_SIZE_MAP: Record<string, string> = {
  sm: 'text-xl sm:text-2xl lg:text-3xl',
  md: 'text-2xl sm:text-3xl lg:text-4xl',
  lg: 'text-3xl sm:text-4xl lg:text-5xl',
  xl: 'text-4xl sm:text-5xl lg:text-6xl',
};

const SUBTITLE_SIZE_MAP: Record<string, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

const LINE_HEIGHT_MAP: Record<string, string> = {
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
};

// ─── 装饰条宽度 ───

function resolveDividerWidth(widthKey: string, customPx: number): string {
  switch (widthKey) {
    case 'xs':     return '32px';
    case 'sm':     return '40px';
    case 'lg':     return '80px';
    case 'full':   return '100%';
    case 'custom': return `${customPx}px`;
    default:       return '56px'; // md
  }
}

// ─── 主入口 ───

export interface SectionTextConfig {
  /** 行高 Tailwind 类 */
  lineHeightClass: string;
  /** 标题：Tailwind 类 + 可选 inline style（处理 custom 颜色/字号） */
  title: {
    sizeClass: string;
    colorClass: string;
    style: React.CSSProperties;
  };
  /** 副标题：同上 */
  subtitle: {
    sizeClass: string;
    colorClass: string;
    style: React.CSSProperties;
  };
  /** 装饰条（跟随标题出现） */
  divider: {
    show: boolean;
    className: string;
    style: React.CSSProperties;
  };
}

/**
 * @param config  section.config（JSONB 对象）
 * @param defaults 可覆盖的默认值（对不同区块进行微调）
 */
export function getSectionTextConfig(
  config: Record<string, unknown>,
  defaults: {
    titleSizeClass?: string;
    subtitleSizeClass?: string;
    titleColorClass?: string;
    subtitleColorClass?: string;
    lineHeight?: string;
  } = {},
): SectionTextConfig {
  const titleSizeKey = str(config.text_title_size, 'default');
  const subtitleSizeKey = str(config.text_subtitle_size, 'default');
  const lineHeightKey = str(config.text_line_height, 'normal');
  const titleColorKey = str(config.text_title_color, 'default');
  const titleColorCustom = str(config.text_title_color_custom);
  const subtitleColorKey = str(config.text_subtitle_color, 'muted-foreground');
  const subtitleColorCustom = str(config.text_subtitle_color_custom);

  const showDivider = config.text_divider !== false;
  const dividerWidthKey = str(config.text_divider_width, 'md');
  const dividerWidthCustomPx = num(config.text_divider_width_custom, 56);
  const dividerColorKey = str(config.text_divider_color, 'title');

  // 标题字号
  let titleSizeClass: string;
  let titleSizeStyle: React.CSSProperties = {};
  if (titleSizeKey === 'custom') {
    titleSizeClass = '';
    titleSizeStyle = { fontSize: `${num(config.text_title_size_custom, 32)}px` };
  } else if (titleSizeKey === 'default') {
    titleSizeClass = defaults.titleSizeClass ?? '';
  } else {
    titleSizeClass = TITLE_SIZE_MAP[titleSizeKey] ?? (defaults.titleSizeClass ?? '');
  }

  // 副标题字号
  let subtitleSizeClass: string;
  let subtitleSizeStyle: React.CSSProperties = {};
  if (subtitleSizeKey === 'custom') {
    subtitleSizeClass = '';
    subtitleSizeStyle = { fontSize: `${num(config.text_subtitle_size_custom, 18)}px` };
  } else if (subtitleSizeKey === 'default') {
    subtitleSizeClass = defaults.subtitleSizeClass ?? '';
  } else {
    subtitleSizeClass = SUBTITLE_SIZE_MAP[subtitleSizeKey] ?? (defaults.subtitleSizeClass ?? '');
  }

  const titleColor = resolveColor(titleColorKey, titleColorCustom, 'text');
  const subtitleColor = resolveColor(subtitleColorKey, subtitleColorCustom, 'text');

  // 装饰条颜色：'title' 跟随标题
  const resolvedDividerColorKey = dividerColorKey === 'title'
    ? (titleColorKey === 'default' ? 'primary' : titleColorKey)
    : dividerColorKey;
  const dividerBg = resolveColor(resolvedDividerColorKey, str(config.text_divider_color_custom), 'bg');
  // 如果标题是 custom 颜色且装饰条跟随标题，用 backgroundColor inline
  const dividerBgStyle: React.CSSProperties = dividerColorKey === 'title' && titleColorKey === 'custom'
    ? { backgroundColor: titleColorCustom || undefined }
    : (dividerBg.style ?? {});
  const dividerBgClass = dividerColorKey === 'title' && titleColorKey === 'custom'
    ? ''
    : (dividerBg.className ?? 'bg-primary');

  return {
    lineHeightClass: LINE_HEIGHT_MAP[lineHeightKey] ?? (defaults.lineHeight ?? 'leading-normal'),
    title: {
      sizeClass: titleSizeClass,
      colorClass: titleColor.className,
      style: { ...titleColor.style, ...titleSizeStyle },
    },
    subtitle: {
      sizeClass: subtitleSizeClass,
      colorClass: subtitleColor.className,
      style: { ...subtitleColor.style, ...subtitleSizeStyle },
    },
    divider: {
      show: showDivider,
      className: `h-1 rounded-full mt-4 ${dividerBgClass}`,
      style: { width: resolveDividerWidth(dividerWidthKey, dividerWidthCustomPx), ...dividerBgStyle },
    },
  };
}

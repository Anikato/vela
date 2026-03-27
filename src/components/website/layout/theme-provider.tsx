import { getActiveTheme } from '@/server/services/theme.service';
import type { ThemeConfig, ThemeBackground, RadiusPreset } from '@/types/theme';
import { buildGoogleFontsUrl } from '@/lib/google-fonts-catalog';

const RADIUS_MAP: Record<RadiusPreset, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
};

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
};

function buildCssVariables(config: ThemeConfig): string {
  const vars: string[] = [];

  for (const [key, value] of Object.entries(config.colors)) {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const isAlreadyFunction = /^(hsl|oklch|rgb|lab|lch|hwb|color)\(/.test(value.trim());
    vars.push(`--${cssKey}: ${isAlreadyFunction ? value : `hsl(${value})`};`);
  }

  vars.push(`--font-latin: '${config.fonts.latin}';`);
  vars.push(`--font-cjk: '${config.fonts.cjk}';`);
  vars.push(`--font-arabic: '${config.fonts.arabic}';`);
  // 标题字体：单独设置则用独立字体，否则跟随正文字体
  const headingFont = config.fonts.headingFont ?? config.fonts.latin;
  vars.push(`--font-heading: '${headingFont}';`);
  vars.push(`--heading-weight: ${config.fonts.headingWeight};`);
  vars.push(`--heading-letter-spacing: ${config.fonts.letterSpacing ?? 'normal'};`);
  vars.push(`--body-size: ${config.fonts.bodySize};`);

  vars.push(`--btn-animation: ${config.button.animation};`);
  vars.push(`--btn-font-weight: ${config.button.fontWeight};`);

  vars.push(`--nav-font-weight: ${config.nav.fontWeight};`);

  vars.push(`--radius: ${RADIUS_MAP[config.layout.radius] ?? '0.5rem'};`);
  vars.push(`--shadow: ${SHADOW_MAP[config.layout.shadow] ?? 'none'};`);
  vars.push(`--max-width: ${config.layout.maxWidth || '80rem'};`);
  vars.push(`--logo-height: ${config.layout.logoHeight ?? 36}px;`);

  return `:root { ${vars.join(' ')} }`;
}

function buildDataAttributes(config: ThemeConfig): Record<string, string> {
  return {
    'data-btn-animation': config.button.animation,
    'data-btn-shape': config.button.shape,
    'data-btn-size': config.button.size,
    'data-btn-uppercase': config.button.uppercase ? '1' : '',
    'data-btn-shadow': config.button.shadow ? '1' : '',
    'data-nav-style': config.nav.style,
    'data-nav-spacing': config.nav.spacing,
    'data-nav-uppercase': config.nav.uppercase ? '1' : '',
    'data-header-style': config.layout.headerStyle,
    'data-header-transparent': config.layout.headerTransparent ? '1' : '',
    'data-footer-style': config.layout.footerStyle,
    'data-default-block-bg': config.layout.defaultBlockBackground ?? '',
  };
}

function buildBackgroundCss(bg: ThemeBackground | undefined, selector: string): string {
  if (!bg || bg.type === 'solid') return '';
  const rules: string[] = [];
  if (bg.type === 'gradient' && bg.gradient) {
    rules.push(`${selector} { background: ${bg.gradient}; }`);
  }
  if (bg.type === 'image' && bg.imageUrl) {
    rules.push(
      `${selector} { background-image: url('${bg.imageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat; position: relative; }`,
    );
    if (bg.imageOverlay && bg.imageOverlay > 0) {
      rules.push(
        `${selector}::before { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,${bg.imageOverlay / 100}); pointer-events: none; z-index: 0; }`,
        `${selector} > * { position: relative; z-index: 1; }`,
      );
    }
  }
  return rules.join('\n');
}

function buildCustomCss(config: ThemeConfig): string {
  return config.customCss?.trim() || '';
}

export async function ThemeStyle() {
  const theme = await getActiveTheme();
  if (!theme) return null;

  const cfg = theme.config;
  const css = buildCssVariables(cfg);
  const customCss = buildCustomCss(cfg);
  const attrs = buildDataAttributes(cfg);

  // 收集需要加载的字体（正文 + 标题独立字体）
  const fontNames = (
    [cfg.fonts.latin, cfg.fonts.cjk, cfg.fonts.arabic, cfg.fonts.headingFont] as (string | undefined)[]
  ).filter((f): f is string => typeof f === 'string' && f.trim().length > 0);
  const googleFontsUrl = buildGoogleFontsUrl([...new Set(fontNames)]);

  const bgCss = [
    buildBackgroundCss(cfg.layout.pageBackground, '.vt-page-content'),
    buildBackgroundCss(cfg.layout.headerBackground, '.vt-header'),
    buildBackgroundCss(cfg.layout.footerBackground, '.vt-footer'),
  ]
    .filter(Boolean)
    .join('\n');

  const attrScript = `(function(){var h=document.documentElement;${Object.entries(attrs)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `h.setAttribute('${k}','${v}')`)
    .join(';')}})()`;

  const allExtra = [bgCss, customCss ? `.vt-page-content { ${customCss} }` : '']
    .filter(Boolean)
    .join('\n');

  return (
    <>
      {googleFontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link href={googleFontsUrl} rel="stylesheet" />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {allExtra && <style dangerouslySetInnerHTML={{ __html: allExtra }} />}
      <script dangerouslySetInnerHTML={{ __html: attrScript }} />
    </>
  );
}

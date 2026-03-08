import { getActiveTheme } from '@/server/services/theme.service';
import type { ThemeConfig, RadiusPreset, ShadowPreset } from '@/types/theme';

const RADIUS_MAP: Record<RadiusPreset, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
};

function buildCssVariables(config: ThemeConfig): string {
  const vars: string[] = [];

  for (const [key, value] of Object.entries(config.colors)) {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    vars.push(`--${cssKey}: ${value};`);
  }

  vars.push(`--font-latin: ${config.fonts.latin};`);
  vars.push(`--font-cjk: ${config.fonts.cjk};`);
  vars.push(`--font-arabic: ${config.fonts.arabic};`);
  vars.push(`--heading-weight: ${config.fonts.headingWeight};`);
  vars.push(`--body-size: ${config.fonts.bodySize};`);

  vars.push(`--btn-shape: ${config.button.shape};`);
  vars.push(`--btn-size: ${config.button.size};`);
  vars.push(`--btn-animation: ${config.button.animation};`);

  vars.push(`--nav-style: ${config.nav.style};`);
  vars.push(`--nav-spacing: ${config.nav.spacing};`);

  vars.push(`--header-style: ${config.layout.headerStyle};`);
  vars.push(`--footer-style: ${config.layout.footerStyle};`);
  vars.push(`--radius: ${RADIUS_MAP[config.layout.radius] ?? '0.5rem'};`);
  vars.push(`--max-width: ${config.layout.maxWidth};`);

  return `:root { ${vars.join(' ')} }`;
}

export async function ThemeStyle() {
  const theme = await getActiveTheme();
  if (!theme) return null;

  const css = buildCssVariables(theme.config);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

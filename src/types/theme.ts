export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  ring: string;
}

export interface ThemeFonts {
  latin: string;
  cjk: string;
  arabic: string;
  headingWeight: string;
  bodySize: string;
}

export type ButtonShape = 'square' | 'soft' | 'rounded' | 'pill';
export type ButtonSize = 'compact' | 'default' | 'large' | 'xl';
export type ButtonAnimation = 'none' | 'lift' | 'scale' | 'shine' | 'glow';

export interface ThemeButton {
  shape: ButtonShape;
  size: ButtonSize;
  animation: ButtonAnimation;
  uppercase: boolean;
  fontWeight: string;
  shadow: boolean;
}

export type NavStyle = 'default' | 'minimal' | 'pill' | 'underline' | 'border';
export type NavSpacing = 'compact' | 'default' | 'loose';

export interface ThemeNav {
  style: NavStyle;
  spacing: NavSpacing;
  uppercase: boolean;
  fontWeight: string;
}

export type HeaderStyle = 'default' | 'centered' | 'minimal' | 'two-row' | 'tall-logo';
export type FooterStyle = 'standard' | 'minimal' | 'expanded';
export type RadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ShadowPreset = 'none' | 'sm' | 'md' | 'lg';

export interface ThemeBackground {
  type: 'solid' | 'gradient' | 'image';
  gradient?: string;
  imageUrl?: string;
  imageOverlay?: number;
}

export type CardHoverEffect = 'none' | 'lift' | 'scale' | 'border-glow' | 'shadow';
export type CardImageRatio = '1:1' | '4:3' | '3:2' | '16:9';
export type ProductGridColumns = 2 | 3 | 4;

export interface ThemeProductCard {
  imageRatio: CardImageRatio;
  hoverEffect: CardHoverEffect;
  showSku: boolean;
  showDescription: boolean;
  gridColumns: ProductGridColumns;
}

export interface ThemeAnnouncementBar {
  enabled: boolean;
  bgColor: string;
  textColor: string;
  dismissible: boolean;
  linkUrl?: string;
}

export interface ThemeLayout {
  headerStyle: HeaderStyle;
  headerTransparent: boolean;
  footerStyle: FooterStyle;
  radius: RadiusPreset;
  shadow: ShadowPreset;
  maxWidth: string;
  pageBackground?: ThemeBackground;
  headerBackground?: ThemeBackground;
  headerBlur: boolean;
  footerBackground?: ThemeBackground;
  logoHeight: number;
  defaultBlockBackground?: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: ThemeFonts;
  button: ThemeButton;
  nav: ThemeNav;
  layout: ThemeLayout;
  productCard: ThemeProductCard;
  announcementBar: ThemeAnnouncementBar;
  customCss?: string;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {
    primary: '222.2 47.4% 11.2%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    ring: '222.2 84% 4.9%',
  },
  fonts: {
    latin: 'Inter',
    cjk: 'Noto Sans SC',
    arabic: 'Noto Sans Arabic',
    headingWeight: '700',
    bodySize: '16px',
  },
  button: {
    shape: 'rounded',
    size: 'default',
    animation: 'none',
    uppercase: false,
    fontWeight: '500',
    shadow: false,
  },
  nav: {
    style: 'default',
    spacing: 'default',
    uppercase: false,
    fontWeight: '500',
  },
  layout: {
    headerStyle: 'default',
    headerTransparent: false,
    footerStyle: 'standard',
    radius: 'md',
    shadow: 'sm',
    maxWidth: '1280px',
    headerBlur: true,
    logoHeight: 44,
  },
  productCard: {
    imageRatio: '4:3',
    hoverEffect: 'lift',
    showSku: true,
    showDescription: true,
    gridColumns: 3,
  },
  announcementBar: {
    enabled: false,
    bgColor: '222.2 47.4% 11.2%',
    textColor: '210 40% 98%',
    dismissible: true,
  },
};

import { getCachedActiveTheme } from '@/lib/data-cache';
import { getCaptchaSiteKey } from '@/server/services/captcha.service';
import { DEFAULT_THEME_CONFIG } from '@/types/theme';
import { sectionRegistry } from './registry';
import { SectionWrapper } from './section-wrapper';
import type { WebsiteSection } from './types';

interface SectionRendererProps {
  sections: WebsiteSection[];
}

const SECTIONS_NEEDING_CAPTCHA = new Set(['contact_form']);

export async function SectionRenderer({ sections }: SectionRendererProps) {
  if (!sections.length) return null;

  const needsCaptcha = sections.some(
    (s) => s.isActive && SECTIONS_NEEDING_CAPTCHA.has(s.type),
  );
  const [captchaSiteKey, theme] = await Promise.all([
    needsCaptcha ? getCaptchaSiteKey() : Promise.resolve(null),
    getCachedActiveTheme(),
  ]);

  const defaultBlockBg = theme?.config?.layout?.defaultBlockBackground ?? DEFAULT_THEME_CONFIG.layout.defaultBlockBackground ?? 'white';

  return (
    <>
      {sections.map((section) => {
        const Block = sectionRegistry[section.type];
        if (!Block || !section.isActive) return null;

        const extraProps = SECTIONS_NEEDING_CAPTCHA.has(section.type)
          ? { captchaSiteKey }
          : {};

        const sectionWithDefaultBg = {
          ...section,
          config: { ...section.config, _defaultBg: defaultBlockBg },
        };

        return (
          <SectionWrapper key={section.id} section={sectionWithDefaultBg}>
            <Block section={section} {...extraProps} />
          </SectionWrapper>
        );
      })}
    </>
  );
}

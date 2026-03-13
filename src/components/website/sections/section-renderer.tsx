import { getCaptchaSiteKey } from '@/server/services/captcha.service';
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
  const captchaSiteKey = needsCaptcha ? await getCaptchaSiteKey() : null;

  return (
    <>
      {sections.map((section) => {
        const Block = sectionRegistry[section.type];
        if (!Block || !section.isActive) return null;

        const extraProps = SECTIONS_NEEDING_CAPTCHA.has(section.type)
          ? { captchaSiteKey }
          : {};

        return (
          <SectionWrapper key={section.id} section={section}>
            <Block section={section} {...extraProps} />
          </SectionWrapper>
        );
      })}
    </>
  );
}

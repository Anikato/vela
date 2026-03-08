import { sectionRegistry } from './registry';
import { SectionWrapper } from './section-wrapper';
import type { WebsiteSection } from './types';

interface SectionRendererProps {
  sections: WebsiteSection[];
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  if (!sections.length) return null;

  return (
    <>
      {sections.map((section) => {
        const Block = sectionRegistry[section.type];
        if (!Block || !section.isActive) return null;

        return (
          <SectionWrapper key={section.id} section={section}>
            <Block section={section} />
          </SectionWrapper>
        );
      })}
    </>
  );
}

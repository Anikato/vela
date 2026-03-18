import type { SectionComponentProps } from '../types';

export function RichTextSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  if (!tr.title && !tr.content) return null;

  return (
    <div>
      {tr.title ? <h2 className="text-2xl font-semibold">{tr.title}</h2> : null}
      {tr.content ? (
        <div
          className="prose prose-sm mt-4 max-w-none text-foreground sm:prose"
          dangerouslySetInnerHTML={{ __html: tr.content }}
        />
      ) : null}
    </div>
  );
}

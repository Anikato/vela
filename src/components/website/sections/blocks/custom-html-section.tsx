import type { SectionComponentProps } from '../types';

export function CustomHtmlSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const htmlContent = typeof section.config.html === 'string' ? section.config.html : '';

  if (!htmlContent && !tr.title && !tr.content) return null;

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-8 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      {htmlContent ? (
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      ) : tr.content ? (
        <div
          className="prose prose-sm mx-auto max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: tr.content }}
        />
      ) : null}
    </div>
  );
}

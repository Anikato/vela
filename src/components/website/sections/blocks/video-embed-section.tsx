import type { SectionComponentProps } from '../types';

function parseVideoUrl(url: string): { provider: 'youtube' | 'vimeo' | null; embedUrl: string | null } {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (youtubeMatch) {
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`,
    };
  }

  return { provider: null, embedUrl: null };
}

export function VideoEmbedSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const videoUrl = typeof section.config.video_url === 'string' ? section.config.video_url : '';
  const aspectRatio = section.config.aspect_ratio === '4/3' ? 'aspect-[4/3]' : 'aspect-video';

  const parsed = videoUrl ? parseVideoUrl(videoUrl) : null;

  if (!parsed?.embedUrl && !tr.title && !tr.subtitle) return null;

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

      {parsed?.embedUrl && (
        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-black">
          <div className={aspectRatio}>
            <iframe
              src={parsed.embedUrl}
              title={tr.title ?? 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            />
          </div>
        </div>
      )}

      {tr.content && (
        <div
          className="prose prose-sm mx-auto mt-6 max-w-3xl text-center text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: tr.content }}
        />
      )}
    </div>
  );
}

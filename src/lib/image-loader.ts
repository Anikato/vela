/**
 * Custom image loader for Next.js <Image>.
 *
 * Uploaded raster images are pre-processed at upload time into multiple WebP
 * variants (thumbnail 200px / small 400px / medium 800px / large 1200px / original).
 * This loader maps the requested width to the closest pre-built variant so that
 * nginx can serve it directly — no Next.js image optimizer overhead.
 */

const VARIANT_BREAKPOINTS = [
  { maxWidth: 200, variant: 'thumbnail' },
  { maxWidth: 400, variant: 'small' },
  { maxWidth: 800, variant: 'medium' },
  { maxWidth: 1200, variant: 'large' },
] as const;

export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes('/uploads/') || !src.endsWith('/original.webp')) {
    return src;
  }

  const basePath = src.slice(0, -'/original.webp'.length);
  const match = VARIANT_BREAKPOINTS.find((bp) => width <= bp.maxWidth);
  return `${basePath}/${match ? match.variant : 'original'}.webp`;
}

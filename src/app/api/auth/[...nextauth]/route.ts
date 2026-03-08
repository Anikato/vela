import { type NextRequest, NextResponse } from 'next/server';

import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { handlers } from '@/server/auth';

export const { GET } = handlers;

export async function POST(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const segments = await context.params;
  const action = segments.nextauth?.join('/');

  if (action === 'callback/credentials') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`login:${ip}`, RATE_LIMITS.LOGIN);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts, please try again later' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }
  }

  return handlers.POST(request);
}

import { NextResponse } from 'next/server';

import { ValidationError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { auth } from '@/server/auth';
import { uploadMedia } from '@/server/services/media.service';

export const runtime = 'nodejs';

/**
 * 文件上传 API
 * - 仅后台已登录用户可访问
 * - multipart/form-data 字段：
 *   - file: File (required)
 *   - alt: string (optional)
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`upload:${ip}`, RATE_LIMITS.UPLOAD);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many uploads, please try later' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const alt = formData.get('alt');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'File is required' },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadMedia({
      fileBuffer: buffer,
      originalName: file.name,
      mimeType: file.type,
      alt: typeof alt === 'string' ? alt : null,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    createLogger('api.upload').error({ err: error }, 'Upload failed: %s', errMsg);
    return NextResponse.json(
      { success: false, error: `Upload failed: ${errMsg}` },
      { status: 500 },
    );
  }
}

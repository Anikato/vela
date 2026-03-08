import { NextResponse } from 'next/server';
import { getActiveRedirects } from '@/server/services/redirect.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await getActiveRedirects();
    const map: Record<string, { toPath: string; statusCode: number }> = {};
    for (const r of rows) {
      map[r.fromPath.toLowerCase()] = { toPath: r.toPath, statusCode: r.statusCode };
    }
    return NextResponse.json({ success: true, data: map });
  } catch (error) {
    console.error('Failed to load redirects:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { createLogger } from '@/lib/logger';
import { db } from '@/server/db';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (error) {
    createLogger('api.health').error({ err: error }, 'DB health check failed');
    return NextResponse.json(
      { success: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }
}

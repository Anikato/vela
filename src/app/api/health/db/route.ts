import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/server/db';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ success: true, data: { ok: true } });
  } catch (error) {
    console.error('DB health check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Database unavailable' },
      { status: 503 },
    );
  }
}

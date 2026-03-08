import { desc } from 'drizzle-orm';

import { db } from '@/server/db';
import { inquiries, inquiryProducts } from '@/server/db/schema';

/**
 * 导出所有询盘为 CSV 格式。
 */
export async function exportInquiriesCsv(): Promise<string> {
  const allInquiries = await db.query.inquiries.findMany({
    with: { products: true },
    orderBy: [desc(inquiries.createdAt)],
  });

  const headers = [
    'inquiry_number',
    'status',
    'name',
    'email',
    'phone',
    'company',
    'country',
    'message',
    'products',
    'source_url',
    'internal_notes',
    'created_at',
  ];

  const rows: string[][] = [headers];

  for (const inq of allInquiries) {
    const productsSummary = inq.products
      .map((p) => {
        const snap = p.productSnapshot as { name: string; sku: string };
        return `${snap.name} (${snap.sku}) x${p.quantity}`;
      })
      .join('; ');

    rows.push([
      inq.inquiryNumber,
      inq.status,
      inq.name,
      inq.email,
      inq.phone ?? '',
      inq.company ?? '',
      inq.country ?? '',
      inq.message,
      productsSummary,
      inq.sourceUrl ?? '',
      inq.internalNotes ?? '',
      inq.createdAt.toISOString(),
    ]);
  }

  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

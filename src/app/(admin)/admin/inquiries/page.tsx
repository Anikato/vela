export const metadata = { title: '询盘管理' };

import { InquiryManagement } from '@/components/admin/inquiries/inquiry-management';
import { getInquiryList, getInquiryStats } from '@/server/services/inquiry.service';

export default async function InquiriesPage() {
  const [list, stats] = await Promise.all([
    getInquiryList({ page: 1, pageSize: 20 }),
    getInquiryStats(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">询盘管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          查看和管理客户询盘，跟进状态并记录内部备注
        </p>
      </div>
      <InquiryManagement initialData={list} initialStats={stats} />
    </div>
  );
}

export const metadata = { title: '数据统计' };

import { getInquiryStatsDetail } from '@/server/services/inquiry-stats.service';
import { InquiryStatsPage } from '@/components/admin/inquiries/inquiry-stats-page';

export default async function InquiryStatsRoute() {
  const stats = await getInquiryStatsDetail();
  return <InquiryStatsPage stats={stats} />;
}

import { getAuditLogList } from '@/server/services/audit-log.service';
import { AuditLogManagement } from '@/components/admin/audit-logs/audit-log-management';

interface Props {
  searchParams: Promise<{
    page?: string;
    entityType?: string;
    search?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const entityType = params.entityType ?? '';
  const search = params.search ?? '';

  const data = await getAuditLogList({
    page,
    pageSize: 30,
    entityType: entityType || undefined,
    search: search || undefined,
  });

  return (
    <AuditLogManagement
      initialData={data}
      currentEntityType={entityType}
      currentSearch={search}
    />
  );
}

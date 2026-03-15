export const metadata = { title: '用户管理' };

import { auth } from '@/server/auth';
import { getAllUsers } from '@/server/services/user.service';
import { UserManagement } from '@/components/admin/users/user-management';

/**
 * 用户管理页面
 */
export default async function UsersPage() {
  const session = await auth();
  const users = await getAllUsers();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理后台登录账号（当前仅 Admin 角色）
          </p>
        </div>
      </div>
      <UserManagement
        initialUsers={users}
        currentUserId={session?.user?.id ?? ''}
      />
    </div>
  );
}

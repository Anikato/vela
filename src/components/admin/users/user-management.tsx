'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  createUserAction,
  resetUserPasswordAction,
  setUserActiveAction,
  updateUserProfileAction,
} from '@/server/actions/user.actions';
import type { SafeUser } from '@/server/services/user.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserManagementProps {
  initialUsers: SafeUser[];
  currentUserId: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function UserManagement({ initialUsers, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [resetTarget, setResetTarget] = useState<SafeUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editTarget, setEditTarget] = useState<SafeUser | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [users],
  );

  async function handleCreate() {
    if (!email.trim() || !username.trim() || password.length < 8) {
      toast.error('请填写完整信息，且密码至少 8 位');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createUserAction({
        email: email.trim(),
        username: username.trim(),
        password,
      });

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '创建失败');
        return;
      }

      setUsers((prev) => [result.data, ...prev]);
      setCreateOpen(false);
      setEmail('');
      setUsername('');
      setPassword('');
      toast.success('用户已创建');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(user: SafeUser, nextActive: boolean) {
    setIsSubmitting(true);
    try {
      const result = await setUserActiveAction({
        id: user.id,
        isActive: nextActive,
      });
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '更新失败');
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === user.id ? result.data : item)));
      toast.success(nextActive ? '账号已启用' : '账号已停用');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    if (newPassword.length < 8) {
      toast.error('新密码至少 8 位');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetUserPasswordAction({
        id: resetTarget.id,
        password: newPassword,
      });

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '重置失败');
        return;
      }

      toast.success('密码已重置');
      setResetTarget(null);
      setNewPassword('');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditDialog(user: SafeUser) {
    setEditTarget(user);
    setEditEmail(user.email);
    setEditUsername(user.name);
    setEditPassword('');
  }

  async function handleUpdateProfile() {
    if (!editTarget) return;
    if (!editEmail.trim() || !editUsername.trim()) {
      toast.error('邮箱和用户名不能为空');
      return;
    }
    if (editPassword && editPassword.length < 8) {
      toast.error('新密码至少 8 位');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateUserProfileAction({
        id: editTarget.id,
        email: editEmail.trim(),
        username: editUsername.trim(),
        password: editPassword || undefined,
      });

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '更新失败');
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === editTarget.id ? result.data : item)));
      toast.success('用户信息已更新');
      setEditTarget(null);
      setEditPassword('');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建用户
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  暂无用户
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => (
                <TableRow key={user.id} className="border-border/50">
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        disabled={isSubmitting || user.id === currentUserId}
                        onCheckedChange={(checked) => handleToggleActive(user, checked)}
                        aria-label={`切换用户 ${user.email} 状态`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {user.isActive ? '启用' : '停用'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => openEditDialog(user)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => setResetTarget(user)}
                      >
                        <KeyRound className="mr-1 h-3.5 w-3.5" />
                        重置密码
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
            <DialogDescription>
              当前阶段仅支持 Admin 角色，创建后可用于后台登录。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <Input
              placeholder="用户名（用于登录）"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="初始密码（至少 8 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              {resetTarget ? `为 ${resetTarget.email} 设置新密码。` : '设置新密码'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              type="password"
              placeholder="新密码（至少 8 位）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleResetPassword} disabled={isSubmitting}>
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              可修改邮箱、用户名；如需更新密码可直接填写新密码。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <Input
              type="email"
              placeholder="邮箱"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              placeholder="用户名（用于登录）"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="新密码（留空则不修改）"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

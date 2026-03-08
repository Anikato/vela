'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createRedirectAction,
  updateRedirectAction,
  deleteRedirectAction,
} from '@/server/actions/redirect.actions';
import type { Redirect } from '@/server/services/redirect.service';

interface Props {
  initialRedirects: Redirect[];
}

export function RedirectManagement({ initialRedirects }: Props) {
  const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');
  const [statusCode, setStatusCode] = useState('301');
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setFromPath('');
    setToPath('');
    setStatusCode('301');
    setDialogOpen(true);
  }

  function openEdit(r: Redirect) {
    setEditing(r);
    setFromPath(r.fromPath);
    setToPath(r.toPath);
    setStatusCode(String(r.statusCode));
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        const res = await updateRedirectAction({
          id: editing.id,
          fromPath,
          toPath,
          statusCode: Number(statusCode),
        });
        if (!res.success) throw new Error(typeof res.error === 'string' ? res.error : '保存失败');
        setRedirects((prev) => prev.map((r) => (r.id === editing.id ? res.data : r)));
        toast.success('重定向已更新');
      } else {
        const res = await createRedirectAction({
          fromPath,
          toPath,
          statusCode: Number(statusCode),
        });
        if (!res.success) throw new Error(typeof res.error === 'string' ? res.error : '创建失败');
        setRedirects((prev) => [res.data, ...prev]);
        toast.success('重定向已创建');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(r: Redirect) {
    const res = await updateRedirectAction({ id: r.id, isActive: !r.isActive });
    if (!res.success) {
      toast.error('操作失败');
      return;
    }
    setRedirects((prev) => prev.map((item) => (item.id === r.id ? res.data : item)));
  }

  async function handleDelete(r: Redirect) {
    if (!confirm(`确认删除重定向 ${r.fromPath} → ${r.toPath}？`)) return;
    const res = await deleteRedirectAction(r.id);
    if (!res.success) {
      toast.error('删除失败');
      return;
    }
    setRedirects((prev) => prev.filter((item) => item.id !== r.id));
    toast.success('已删除');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">301 重定向管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理 URL 重定向规则，常用于归档内容或 URL 变更
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新增重定向
        </Button>
      </div>

      {redirects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">暂无重定向规则</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>源路径</TableHead>
              <TableHead>目标路径</TableHead>
              <TableHead className="w-20">状态码</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redirects.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.fromPath}</TableCell>
                <TableCell className="font-mono text-sm">{r.toPath}</TableCell>
                <TableCell>{r.statusCode}</TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggle(r)}
                    className="text-muted-foreground hover:text-foreground"
                    title={r.isActive ? '点击禁用' : '点击启用'}
                  >
                    {r.isActive ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑重定向' : '新增重定向'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>源路径</Label>
              <Input
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
                placeholder="/old-product/old-slug"
              />
            </div>
            <div className="space-y-2">
              <Label>目标路径</Label>
              <Input
                value={toPath}
                onChange={(e) => setToPath(e.target.value)}
                placeholder="/products"
              />
            </div>
            <div className="space-y-2">
              <Label>状态码</Label>
              <Select value={statusCode} onValueChange={setStatusCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 — 永久重定向</SelectItem>
                  <SelectItem value="302">302 — 临时重定向</SelectItem>
                  <SelectItem value="307">307 — 临时（保留方法）</SelectItem>
                  <SelectItem value="308">308 — 永久（保留方法）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !fromPath || !toPath}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

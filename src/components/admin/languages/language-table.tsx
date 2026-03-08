'use client';

/**
 * 语言列表表格组件
 * 展示所有语言，支持操作按钮
 */

import { useState } from 'react';
import type { Language } from '@/server/services/language.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';

interface LanguageTableProps {
  languages: Language[];
  isLoading: boolean;
  onEdit: (language: Language) => void;
  onDelete: (code: string) => void;
  onSetDefault: (code: string) => void;
  onToggleActive: (code: string) => void;
  onMove: (code: string, direction: 'up' | 'down') => void;
}

export function LanguageTable({
  languages,
  isLoading,
  onEdit,
  onDelete,
  onSetDefault,
  onToggleActive,
  onMove,
}: LanguageTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);

  if (languages.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-12 text-center">
        <p className="text-muted-foreground">
          尚未配置任何语言，请添加第一个语言以开始使用。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-20">排序</TableHead>
              <TableHead>语言代码</TableHead>
              <TableHead>中文名称</TableHead>
              <TableHead>英文名称</TableHead>
              <TableHead>本地名称</TableHead>
              <TableHead className="w-16 text-center">RTL</TableHead>
              <TableHead className="w-24 text-center">默认</TableHead>
              <TableHead className="w-20 text-center">启用</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languages.map((lang, index) => (
              <TableRow key={lang.code} className="border-border/50">
                {/* 排序按钮 */}
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0 || isLoading}
                      onClick={() => onMove(lang.code, 'up')}
                      aria-label="上移"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === languages.length - 1 || isLoading}
                      onClick={() => onMove(lang.code, 'down')}
                      aria-label="下移"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>

                {/* 语言代码 */}
                <TableCell className="font-mono text-sm text-primary/80">{lang.code}</TableCell>

                {/* 英文名 */}
                <TableCell>{lang.chineseName}</TableCell>

                {/* 英文名 */}
                <TableCell>{lang.englishName}</TableCell>

                {/* 本地名 */}
                <TableCell>{lang.nativeName}</TableCell>

                {/* RTL 标记 */}
                <TableCell className="text-center">
                  {lang.isRtl && (
                    <Badge variant="outline" className="border-primary/30 text-xs text-primary/80">
                      RTL
                    </Badge>
                  )}
                </TableCell>

                {/* 默认语言标记 */}
                <TableCell className="text-center">
                  {lang.isDefault ? (
                    <Badge className="bg-primary/20 text-primary text-xs hover:bg-primary/30">
                      默认
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground"
                      disabled={isLoading}
                      onClick={() => onSetDefault(lang.code)}
                    >
                      设为默认
                    </Button>
                  )}
                </TableCell>

                {/* 启用状态 */}
                <TableCell className="text-center">
                  <Switch
                    checked={lang.isActive}
                    disabled={lang.isDefault || isLoading}
                    onCheckedChange={() => onToggleActive(lang.code)}
                    aria-label={`切换 ${lang.englishName} 启用状态`}
                  />
                </TableCell>

                {/* 操作 */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isLoading}
                      onClick={() => onEdit(lang)}
                      aria-label="编辑"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={lang.isDefault || isLoading}
                      onClick={() => setDeleteTarget(lang)}
                      aria-label="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除语言</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除{' '}
              <strong>
                {deleteTarget?.englishName}（{deleteTarget?.code}）
              </strong>
              吗？这将同时删除与该语言关联的所有翻译内容。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget.code);
                  setDeleteTarget(null);
                }
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

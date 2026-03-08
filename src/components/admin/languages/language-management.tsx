'use client';

/**
 * 语言管理主组件（客户端）
 * 包含语言列表表格 + 新增对话框
 */

import { useState } from 'react';
import type { Language } from '@/server/services/language.service';
import { LanguageTable } from './language-table';
import { LanguageDialog } from './language-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  createLanguageAction,
  updateLanguageAction,
  deleteLanguageAction,
  setDefaultLanguageAction,
  toggleLanguageActiveAction,
  reorderLanguagesAction,
} from '@/server/actions/language.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LanguageManagementProps {
  initialLanguages: Language[];
}

export function LanguageManagement({ initialLanguages }: LanguageManagementProps) {
  const router = useRouter();
  const [languages, setLanguages] = useState<Language[]>(initialLanguages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /** 刷新数据 */
  function refreshData() {
    router.refresh();
  }

  /** 创建或更新语言 */
  async function handleSave(data: {
    code: string;
    englishName: string;
    nativeName: string;
    chineseName: string;
    azureCode?: string;
    googleCode?: string;
    isRtl: boolean;
  }) {
    setIsLoading(true);
    try {
      if (editingLanguage) {
        const result = await updateLanguageAction(editingLanguage.code, {
          englishName: data.englishName,
          nativeName: data.nativeName,
          chineseName: data.chineseName,
          azureCode: data.azureCode,
          googleCode: data.googleCode,
          isRtl: data.isRtl,
        });
        if (result.success) {
          toast.success('语言已更新');
          setLanguages((prev) =>
            prev.map((l) => (l.code === editingLanguage.code ? result.data : l)),
          );
        } else {
          toast.error(typeof result.error === 'string' ? result.error : '校验失败');
        }
      } else {
        const result = await createLanguageAction(data);
        if (result.success) {
          toast.success('语言已创建');
          setLanguages((prev) => [...prev, result.data]);
        } else {
          toast.error(typeof result.error === 'string' ? result.error : '校验失败');
        }
      }
      setDialogOpen(false);
      setEditingLanguage(null);
      refreshData();
    } finally {
      setIsLoading(false);
    }
  }

  /** 删除语言 */
  async function handleDelete(code: string) {
    setIsLoading(true);
    try {
      const result = await deleteLanguageAction(code);
      if (result.success) {
        toast.success('语言已删除');
        setLanguages((prev) => prev.filter((l) => l.code !== code));
        refreshData();
      } else {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
      }
    } finally {
      setIsLoading(false);
    }
  }

  /** 设为默认语言 */
  async function handleSetDefault(code: string) {
    setIsLoading(true);
    try {
      const result = await setDefaultLanguageAction(code);
      if (result.success) {
        toast.success('默认语言已更新');
        setLanguages((prev) =>
          prev.map((l) => ({
            ...l,
            isDefault: l.code === code,
            isActive: l.code === code ? true : l.isActive,
          })),
        );
        refreshData();
      } else {
        toast.error(typeof result.error === 'string' ? result.error : '设置失败');
      }
    } finally {
      setIsLoading(false);
    }
  }

  /** 切换语言启用状态 */
  async function handleToggleActive(code: string) {
    setIsLoading(true);
    try {
      const result = await toggleLanguageActiveAction(code);
      if (result.success) {
        setLanguages((prev) =>
          prev.map((l) => (l.code === code ? result.data : l)),
        );
        refreshData();
      } else {
        toast.error(typeof result.error === 'string' ? result.error : '切换失败');
      }
    } finally {
      setIsLoading(false);
    }
  }

  /** 移动排序（上移 / 下移） */
  async function handleMove(code: string, direction: 'up' | 'down') {
    const idx = languages.findIndex((l) => l.code === code);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === languages.length - 1) return;

    const newList = [...languages];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setLanguages(newList);

    const orderedCodes = newList.map((l) => l.code);
    const result = await reorderLanguagesAction(orderedCodes);
    if (!result.success) {
      setLanguages(languages);
      toast.error('排序失败');
    }
  }

  /** 打开编辑对话框 */
  function handleEdit(language: Language) {
    setEditingLanguage(language);
    setDialogOpen(true);
  }

  /** 打开新建对话框 */
  function handleAdd() {
    setEditingLanguage(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          添加语言
        </Button>
      </div>

      <LanguageTable
        languages={languages}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
        onToggleActive={handleToggleActive}
        onMove={handleMove}
      />

      <LanguageDialog
        key={`${editingLanguage?.code ?? 'new'}-${dialogOpen ? 'open' : 'closed'}`}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingLanguage(null);
        }}
        language={editingLanguage}
        onSave={handleSave}
        isLoading={isLoading}
      />
    </div>
  );
}

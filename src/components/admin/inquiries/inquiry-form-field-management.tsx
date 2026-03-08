'use client';

import { useCallback, useState, useTransition } from 'react';
import { GripVertical, Pencil, Plus, Save, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  createFormFieldAction,
  deleteFormFieldAction,
  reorderFormFieldsAction,
  updateFormFieldAction,
} from '@/server/actions/inquiry-form-field.actions';
import type { FormFieldItem } from '@/types/admin';

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: '文本',
  number: '数字',
  select: '下拉选择',
  multiselect: '多选',
  file: '文件上传',
};

interface Language {
  code: string;
  name: string;
}

interface Props {
  initialFields: FormFieldItem[];
  languages: Language[];
}

interface EditingField {
  id: string | null;
  fieldType: string;
  isRequired: boolean;
  isActive: boolean;
  options: string;
  translations: Record<string, { label: string; placeholder: string; helpText: string }>;
}

function emptyEditing(languages: Language[]): EditingField {
  const translations: EditingField['translations'] = {};
  for (const lang of languages) {
    translations[lang.code] = { label: '', placeholder: '', helpText: '' };
  }
  return {
    id: null,
    fieldType: 'text',
    isRequired: false,
    isActive: true,
    options: '',
    translations,
  };
}

function fieldToEditing(field: FormFieldItem, languages: Language[]): EditingField {
  const translations: EditingField['translations'] = {};
  for (const lang of languages) {
    const t = field.translations.find((tr) => tr.locale === lang.code);
    translations[lang.code] = {
      label: t?.label ?? '',
      placeholder: t?.placeholder ?? '',
      helpText: t?.helpText ?? '',
    };
  }
  return {
    id: field.id,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    isActive: field.isActive,
    options: field.options?.join(', ') ?? '',
    translations,
  };
}

export function InquiryFormFieldManagement({ initialFields, languages }: Props) {
  const [fields, setFields] = useState<FormFieldItem[]>(initialFields);
  const [editing, setEditing] = useState<EditingField | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleSave = useCallback(() => {
    if (!editing) return;
    startTransition(async () => {
      const translations = Object.entries(editing.translations)
        .filter(([, v]) => v.label.trim())
        .map(([locale, v]) => ({
          locale,
          label: v.label.trim(),
          placeholder: v.placeholder.trim() || undefined,
          helpText: v.helpText.trim() || undefined,
        }));

      const options = editing.options
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editing.id) {
        const res = await updateFormFieldAction(editing.id, {
          fieldType: editing.fieldType as 'text',
          isRequired: editing.isRequired,
          isActive: editing.isActive,
          options: options.length > 0 ? options : null,
          translations,
        });
        if (res.success) {
          setFields((prev) =>
            prev.map((f) =>
              f.id === editing.id
                ? {
                    ...f,
                    fieldType: editing.fieldType,
                    isRequired: editing.isRequired,
                    isActive: editing.isActive,
                    options: options.length > 0 ? options : null,
                    translations: translations.map((t) => ({
                      locale: t.locale,
                      label: t.label,
                      placeholder: t.placeholder ?? null,
                      helpText: t.helpText ?? null,
                    })),
                  }
                : f,
            ),
          );
          setEditing(null);
        }
      } else {
        if (translations.length === 0) return;
        const res = await createFormFieldAction({
          fieldType: editing.fieldType as 'text',
          isRequired: editing.isRequired,
          isActive: editing.isActive,
          options: options.length > 0 ? options : undefined,
          translations,
        });
        if (res.success) {
          setFields((prev) => [
            ...prev,
            {
              id: res.data.id,
              fieldType: editing.fieldType,
              isRequired: editing.isRequired,
              sortOrder: prev.length,
              isActive: editing.isActive,
              options: options.length > 0 ? options : null,
              translations: translations.map((t) => ({
                locale: t.locale,
                label: t.label,
                placeholder: t.placeholder ?? null,
                helpText: t.helpText ?? null,
              })),
            },
          ]);
          setEditing(null);
        }
      }
    });
  }, [editing]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('确定删除此字段？')) return;
    startTransition(async () => {
      const res = await deleteFormFieldAction(id);
      if (res.success) {
        setFields((prev) => prev.filter((f) => f.id !== id));
      }
    });
  }, []);

  const handleDragEnd = useCallback(
    (toIdx: number) => {
      if (dragIdx === null || dragIdx === toIdx) return;
      setFields((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(toIdx, 0, moved);
        startTransition(async () => {
          await reorderFormFieldsAction(next.map((f) => f.id));
        });
        return next;
      });
      setDragIdx(null);
    },
    [dragIdx],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">询盘表单配置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理询盘表单中的自定义字段，预设字段（姓名、邮箱等）不在此管理
          </p>
        </div>
        <Button onClick={() => setEditing(emptyEditing(languages))} disabled={!!editing}>
          <Plus className="mr-2 h-4 w-4" />
          新建字段
        </Button>
      </div>

      {/* Field list */}
      <div className="rounded-lg border bg-card">
        {fields.length === 0 && !editing ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            暂无自定义字段，预设字段（姓名、邮箱、电话、公司、国家、留言）始终显示
          </p>
        ) : (
          <div className="divide-y divide-border">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDragEnd(idx)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50"
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {field.translations[0]?.label || `字段 ${idx + 1}`}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {FIELD_TYPE_LABELS[field.fieldType] ?? field.fieldType}
                    </span>
                    {field.isRequired && (
                      <span className="text-xs text-destructive">必填</span>
                    )}
                    {!field.isActive && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        已禁用
                      </span>
                    )}
                  </div>
                  {field.translations.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {field.translations.length} 种语言
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(fieldToEditing(field, languages))}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create panel */}
      {editing && (
        <div className="rounded-lg border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing.id ? '编辑字段' : '新建字段'}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">字段类型</label>
              <select
                value={editing.fieldType}
                onChange={(e) => setEditing({ ...editing, fieldType: e.target.value })}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={editing.isRequired}
                  onCheckedChange={(v) => setEditing({ ...editing, isRequired: v })}
                />
                必填
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={editing.isActive}
                  onCheckedChange={(v) => setEditing({ ...editing, isActive: v })}
                />
                启用
              </label>
            </div>
          </div>

          {(editing.fieldType === 'select' || editing.fieldType === 'multiselect') && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                选项（逗号分隔）
              </label>
              <Input
                value={editing.options}
                onChange={(e) => setEditing({ ...editing, options: e.target.value })}
                placeholder="选项A, 选项B, 选项C"
              />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">多语言标签</h3>
            {languages.map((lang) => {
              const t = editing.translations[lang.code] ?? { label: '', placeholder: '', helpText: '' };
              return (
                <div key={lang.code} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <span className="text-sm font-medium md:pt-5">{lang.name}</span>
                  <div>
                    <label className="text-xs text-muted-foreground">标签</label>
                    <Input
                      value={t.label}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          translations: {
                            ...editing.translations,
                            [lang.code]: { ...t, label: e.target.value },
                          },
                        })
                      }
                      placeholder="字段名称"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">占位符</label>
                    <Input
                      value={t.placeholder}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          translations: {
                            ...editing.translations,
                            [lang.code]: { ...t, placeholder: e.target.value },
                          },
                        })
                      }
                      placeholder="提示文字"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">帮助文本</label>
                    <Input
                      value={t.helpText}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          translations: {
                            ...editing.translations,
                            [lang.code]: { ...t, helpText: e.target.value },
                          },
                        })
                      }
                      placeholder="可选"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleSave} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      )}
    </div>
  );
}

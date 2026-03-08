'use client';

/**
 * 新增 / 编辑语言对话框
 */

import { useMemo, useState } from 'react';
import type { Language } from '@/server/services/language.service';
import {
  LANGUAGE_PRESETS,
  getLanguagePresetByCode,
  normalizeLanguageCode,
  type LanguagePreset,
} from '@/lib/language-standards';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface LanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language | null; // null = 新建, 有值 = 编辑
  onSave: (data: {
    code: string;
    englishName: string;
    nativeName: string;
    chineseName: string;
    azureCode?: string;
    googleCode?: string;
    isRtl: boolean;
  }) => Promise<void>;
  isLoading: boolean;
}

export function LanguageDialog({
  open,
  onOpenChange,
  language,
  onSave,
  isLoading,
}: LanguageDialogProps) {
  const isEditing = !!language;

  const [code, setCode] = useState(language?.code ?? '');
  const [englishName, setEnglishName] = useState(language?.englishName ?? '');
  const [nativeName, setNativeName] = useState(language?.nativeName ?? '');
  const [chineseName, setChineseName] = useState(language?.chineseName ?? '');
  const [azureCode, setAzureCode] = useState(language?.azureCode ?? '');
  const [googleCode, setGoogleCode] = useState(language?.googleCode ?? '');
  const [isRtl, setIsRtl] = useState(language?.isRtl ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPreset: LanguagePreset | null = useMemo(() => {
    if (isEditing) {
      return language ? (getLanguagePresetByCode(language.code) ?? null) : null;
    }
    return getLanguagePresetByCode(normalizeLanguageCode(code)) ?? null;
  }, [code, isEditing, language]);

  function handleCodeChange(nextCode: string) {
    setCode(nextCode);
    setErrors((prev) => ({ ...prev, code: '' }));
    if (isEditing) return;

    const preset = getLanguagePresetByCode(normalizeLanguageCode(nextCode));
    if (!preset) return;

    setEnglishName(preset.englishName);
    setNativeName(preset.nativeName);
    setChineseName(preset.chineseName);
    setAzureCode(preset.azureCode);
    setGoogleCode(preset.googleCode);
    setIsRtl(preset.isRtl);
  }

  /** 前端基础校验 */
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = '请输入语言代码';
    } else if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/.test(code.trim())) {
      newErrors.code = '格式：en、en-US、zh-CN、zh-Hans';
    }

    if (!englishName.trim()) {
      newErrors.englishName = '请输入英文名称';
    }

    if (!nativeName.trim()) {
      newErrors.nativeName = '请输入本地名称';
    }

    if (!chineseName.trim()) {
      newErrors.chineseName = '请输入中文名称';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onSave({
      code: normalizeLanguageCode(code),
      englishName: englishName.trim(),
      nativeName: nativeName.trim(),
      chineseName: chineseName.trim(),
      azureCode: azureCode.trim() || undefined,
      googleCode: googleCode.trim() || undefined,
      isRtl,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? '编辑语言' : '添加语言'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? '修改语言的详细信息。'
                : '优先使用标准语言库，自动填充中文名和翻译引擎映射。'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 语言代码 */}
            <div className="grid gap-2">
              <Label htmlFor="code">语言代码</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                list={!isEditing ? 'language-presets' : undefined}
                placeholder="例如 en-US、zh-CN、hr-HR"
                disabled={isEditing || isLoading}
                className={errors.code ? 'border-destructive' : ''}
              />
              {!isEditing && (
                <datalist id="language-presets">
                  {LANGUAGE_PRESETS.map((preset) => (
                    <option
                      key={preset.canonicalCode}
                      value={preset.canonicalCode}
                      label={`${preset.chineseName} / ${preset.englishName}`}
                    />
                  ))}
                </datalist>
              )}
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code}</p>
              )}
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  使用 BCP 47 风格代码，创建后不可更改。
                </p>
              )}
              {!isEditing && selectedPreset && (
                <p className="text-xs text-primary/80">
                  已匹配标准语言：{selectedPreset.chineseName}（{selectedPreset.englishName}）
                </p>
              )}
            </div>

            {/* 英文名 */}
            <div className="grid gap-2">
              <Label htmlFor="englishName">英文名称</Label>
              <Input
                id="englishName"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                placeholder="例如 English、Chinese、Arabic"
                disabled={isLoading || (!isEditing && !!selectedPreset)}
                className={errors.englishName ? 'border-destructive' : ''}
              />
              {errors.englishName && (
                <p className="text-xs text-destructive">{errors.englishName}</p>
              )}
            </div>

            {/* 本地名 */}
            <div className="grid gap-2">
              <Label htmlFor="nativeName">本地名称</Label>
              <Input
                id="nativeName"
                value={nativeName}
                onChange={(e) => setNativeName(e.target.value)}
                placeholder="例如 English、简体中文、العربية"
                disabled={isLoading || (!isEditing && !!selectedPreset)}
                className={errors.nativeName ? 'border-destructive' : ''}
              />
              {errors.nativeName && (
                <p className="text-xs text-destructive">{errors.nativeName}</p>
              )}
            </div>

            {/* 中文名 */}
            <div className="grid gap-2">
              <Label htmlFor="chineseName">中文名称</Label>
              <Input
                id="chineseName"
                value={chineseName}
                onChange={(e) => setChineseName(e.target.value)}
                placeholder="例如 英语（美国）、克罗地亚语（克罗地亚）"
                disabled={isLoading || (!isEditing && !!selectedPreset)}
                className={errors.chineseName ? 'border-destructive' : ''}
              />
              {errors.chineseName && (
                <p className="text-xs text-destructive">{errors.chineseName}</p>
              )}
            </div>

            {/* 供应商映射 */}
            <div className="grid gap-2 rounded-md border border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">自动翻译映射</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label htmlFor="azureCode" className="text-xs">Azure 代码</Label>
                  <Input
                    id="azureCode"
                    value={azureCode}
                    onChange={(e) => setAzureCode(e.target.value)}
                    placeholder="例如 zh-Hans"
                    disabled={isLoading || (!isEditing && !!selectedPreset)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="googleCode" className="text-xs">Google 代码</Label>
                  <Input
                    id="googleCode"
                    value={googleCode}
                    onChange={(e) => setGoogleCode(e.target.value)}
                    placeholder="例如 zh-CN"
                    disabled={isLoading || (!isEditing && !!selectedPreset)}
                  />
                </div>
              </div>
            </div>

            {/* RTL */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="isRtl"
                checked={isRtl}
                onCheckedChange={(checked) => setIsRtl(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="isRtl" className="cursor-pointer">
                从右到左书写（RTL）语言
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? '保存中...'
                : isEditing
                  ? '更新'
                  : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Globe, Loader2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { translateBatchAction } from '@/server/actions/translation.actions';

interface Language {
  code: string;
  name: string;
  isDefault: boolean;
}

interface Props {
  languages: Language[];
  defaultLocale: string;
}

type EntityType = 'ui_translations' | 'products' | 'categories' | 'pages' | 'news';

const ENTITY_LABELS: Record<EntityType, string> = {
  ui_translations: 'UI 翻译',
  products: '产品',
  categories: '分类',
  pages: '页面',
  news: '新闻',
};

export function AutoTranslateManagement({ languages, defaultLocale }: Props) {
  const [sourceLocale, setSourceLocale] = useState(defaultLocale);
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('ui_translations');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const nonSourceLanguages = languages.filter((l) => l.code !== sourceLocale);

  function toggleTarget(code: string) {
    setTargetLocales((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function selectAllTargets() {
    setTargetLocales(nonSourceLanguages.map((l) => l.code));
  }

  function handleTranslate() {
    if (targetLocales.length === 0) return;

    startTransition(async () => {
      setResult(null);

      try {
        if (selectedEntity === 'ui_translations') {
          const { batchTranslateUiKeys } = await import(
            '@/server/actions/ui-translation.actions'
          );
          const res = await batchTranslateUiKeys(sourceLocale, targetLocales);
          if (res.success) {
            setResult(`UI 翻译完成：已翻译 ${res.data.translated} 条到 ${targetLocales.length} 种语言`);
          } else {
            setResult(`失败：${res.error}`);
          }
        } else {
          setResult('该实体类型的批量翻译功能即将支持，当前可在编辑页面使用单条翻译');
        }
      } catch (e) {
        setResult(`错误：${e instanceof Error ? e.message : '翻译失败'}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">自动翻译</h1>
        <p className="text-sm text-muted-foreground mt-1">
          使用 Azure Translator 批量翻译内容到目标语言。请先在「脚本注入」页面配置 API Key。
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-6">
        {/* Entity selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">翻译内容</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ENTITY_LABELS) as EntityType[]).map((entity) => (
              <button
                key={entity}
                onClick={() => setSelectedEntity(entity)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  selectedEntity === entity
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {ENTITY_LABELS[entity]}
              </button>
            ))}
          </div>
        </div>

        {/* Source language */}
        <div>
          <label className="text-sm font-medium mb-2 block">源语言</label>
          <select
            value={sourceLocale}
            onChange={(e) => {
              setSourceLocale(e.target.value);
              setTargetLocales((prev) => prev.filter((c) => c !== e.target.value));
            }}
            className="flex h-9 w-full max-w-xs rounded-md border bg-background px-3 text-sm"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} {lang.isDefault ? '（默认）' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Target languages */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">目标语言</label>
            <button
              onClick={selectAllTargets}
              className="text-xs text-primary hover:underline"
            >
              全选
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {nonSourceLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggleTarget(lang.code)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  targetLocales.includes(lang.code)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Globe className="mr-1 inline h-3 w-3" />
                {lang.name}
              </button>
            ))}
            {nonSourceLanguages.length === 0 && (
              <p className="text-sm text-muted-foreground">请先添加除源语言外的其他语言</p>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            onClick={handleTranslate}
            disabled={isPending || targetLocales.length === 0}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {isPending ? '翻译中...' : `开始翻译 → ${targetLocales.length} 种语言`}
          </Button>

          {result && (
            <p className="text-sm text-muted-foreground">{result}</p>
          )}
        </div>
      </div>
    </div>
  );
}

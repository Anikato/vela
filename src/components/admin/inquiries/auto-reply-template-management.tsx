'use client';

import { useState, useTransition } from 'react';
import { Languages, Save, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { upsertSettingTranslationAction } from '@/server/actions/settings.actions';
import { translateBatchAction } from '@/server/actions/translation.actions';

interface Language {
  code: string;
  name: string;
}

interface TemplateData {
  subject: string;
  body: string;
}

interface Props {
  languages: Language[];
  initialTemplates: Record<string, TemplateData>;
}

const VARIABLES = [
  { key: '{{customerName}}', desc: '客户姓名' },
  { key: '{{inquiryNumber}}', desc: '询盘编号' },
  { key: '{{siteName}}', desc: '网站名称' },
  { key: '{{productList}}', desc: '产品列表（每行一个产品）' },
  { key: '{{company}}', desc: '客户公司名' },
  { key: '{{country}}', desc: '客户国家' },
];

const DEFAULT_SUBJECT = 'Thank you for your inquiry - {{siteName}}';
const DEFAULT_BODY = `Dear {{customerName}},

Thank you for contacting {{siteName}}! We have received your inquiry #{{inquiryNumber}} and our team will review it shortly.

{{productList}}

We typically respond within 24 business hours. If you have any urgent questions, please don't hesitate to reach out to us directly.

Best regards,
{{siteName}} Team`;

export function AutoReplyTemplateManagement({ languages, initialTemplates }: Props) {
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState<Record<string, TemplateData>>(() => {
    const map: Record<string, TemplateData> = {};
    for (const lang of languages) {
      map[lang.code] = initialTemplates[lang.code] ?? { subject: '', body: '' };
    }
    return map;
  });

  function getTemplate(locale: string): TemplateData {
    return templates[locale] ?? { subject: '', body: '' };
  }

  function setField(locale: string, field: 'subject' | 'body', value: string) {
    setTemplates((prev) => ({
      ...prev,
      [locale]: { ...getTemplate(locale), [field]: value },
    }));
  }

  function handleFillDefault(locale: string) {
    setTemplates((prev) => ({
      ...prev,
      [locale]: { subject: DEFAULT_SUBJECT, body: DEFAULT_BODY },
    }));
    toast.success('已填入默认英文模板');
  }

  function handleSave(locale: string) {
    const t = getTemplate(locale);
    startTransition(async () => {
      const res = await upsertSettingTranslationAction({
        locale,
        inquiryAutoReplySubject: t.subject || null,
        inquiryAutoReplyBody: t.body || null,
      });
      if (res.success) {
        toast.success(`${locale} 模板已保存`);
      } else {
        toast.error(typeof res.error === 'string' ? res.error : '保存失败');
      }
    });
  }

  function handleAutoTranslate(sourceLocale: string) {
    const source = getTemplate(sourceLocale);
    if (!source.subject && !source.body) {
      toast.error('请先填写当前语言的模板内容');
      return;
    }

    const targetLocales = languages
      .map((l) => l.code)
      .filter((code) => code !== sourceLocale);

    if (targetLocales.length === 0) {
      toast.info('没有其他语言需要翻译');
      return;
    }

    const textsToTranslate: string[] = [];
    if (source.subject) textsToTranslate.push(source.subject);
    if (source.body) textsToTranslate.push(source.body);

    startTransition(async () => {
      const res = await translateBatchAction({
        texts: textsToTranslate,
        from: sourceLocale,
        to: targetLocales,
      });

      if (!res.success) {
        toast.error(typeof res.error === 'string' ? res.error : '翻译失败');
        return;
      }

      const newTemplates = { ...templates };
      for (const targetLocale of targetLocales) {
        const translated = res.data[targetLocale];
        if (!translated) continue;
        let idx = 0;
        const t: TemplateData = { ...getTemplate(targetLocale) };
        if (source.subject) {
          t.subject = translated[idx++] ?? '';
        }
        if (source.body) {
          t.body = translated[idx] ?? '';
        }
        newTemplates[targetLocale] = t;
      }
      setTemplates(newTemplates);

      const savePromises = targetLocales.map((locale) => {
        const t = newTemplates[locale];
        return upsertSettingTranslationAction({
          locale,
          inquiryAutoReplySubject: t.subject || null,
          inquiryAutoReplyBody: t.body || null,
        });
      });

      const results = await Promise.allSettled(savePromises);
      const failCount = results.filter(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success),
      ).length;

      if (failCount > 0) {
        toast.warning(`翻译完成，但有 ${failCount} 个语言保存失败`);
      } else {
        toast.success(`已翻译并保存到 ${targetLocales.length} 个语言`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">询盘自动回复模板</h1>
        <p className="text-sm text-muted-foreground mt-1">
          配置客户提交询盘后收到的自动确认邮件内容，支持多语言
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">可用变量</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VARIABLES.map((v) => (
            <div key={v.key} className="text-sm">
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                {v.key}
              </code>
              <span className="text-muted-foreground ml-1.5">{v.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          邮件正文支持换行，发送时会自动转为 HTML 格式。如果某个语言未填写模板，将使用内置英文默认模板。
        </p>
      </div>

      <Tabs defaultValue={languages[0]?.code}>
        <TabsList className="flex-wrap">
          {languages.map((lang) => (
            <TabsTrigger key={lang.code} value={lang.code}>
              {lang.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {languages.map((lang) => {
          const t = getTemplate(lang.code);
          const isEmpty = !t.subject && !t.body;
          return (
            <TabsContent key={lang.code} value={lang.code} className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">邮件主题</label>
                <Input
                  value={t.subject}
                  onChange={(e) => setField(lang.code, 'subject', e.target.value)}
                  placeholder="Thank you for your inquiry - {{siteName}}"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">邮件正文</label>
                <textarea
                  className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[240px] font-mono leading-relaxed"
                  value={t.body}
                  onChange={(e) => setField(lang.code, 'body', e.target.value)}
                  placeholder="Dear {{customerName}},&#10;&#10;Thank you for your inquiry..."
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button onClick={() => handleSave(lang.code)} disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  保存 {lang.name}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAutoTranslate(lang.code)}
                  disabled={isPending || isEmpty}
                >
                  <Languages className="mr-2 h-4 w-4" />
                  翻译到所有其他语言
                </Button>

                {isEmpty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFillDefault(lang.code)}
                    disabled={isPending}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    填入默认模板
                  </Button>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

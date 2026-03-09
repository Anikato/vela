'use client';

import { useState, useTransition } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateScriptsSettingsAction } from '@/server/actions/settings.actions';

interface Props {
  initialSettings: {
    gaId: string | null;
    gtmId: string | null;
    fbPixelId: string | null;
    captchaSiteKey: string | null;
    captchaSecretKey?: string | null;
    translationApiKey?: string | null;
    headScripts: string | null;
    bodyScripts: string | null;
  };
}

export function ScriptsSettingsManagement({ initialSettings }: Props) {
  const [isPending, startTransition] = useTransition();
  

  const [gaId, setGaId] = useState(initialSettings.gaId ?? '');
  const [gtmId, setGtmId] = useState(initialSettings.gtmId ?? '');
  const [fbPixelId, setFbPixelId] = useState(initialSettings.fbPixelId ?? '');
  const [captchaSiteKey, setCaptchaSiteKey] = useState(initialSettings.captchaSiteKey ?? '');
  const [captchaSecretKey, setCaptchaSecretKey] = useState(initialSettings.captchaSecretKey ?? '');
  const [translationApiKey, setTranslationApiKey] = useState(initialSettings.translationApiKey ?? '');
  const [headScripts, setHeadScripts] = useState(initialSettings.headScripts ?? '');
  const [bodyScripts, setBodyScripts] = useState(initialSettings.bodyScripts ?? '');

  function handleSave() {
    startTransition(async () => {
      const res = await updateScriptsSettingsAction({
        gaId: gaId || null,
        gtmId: gtmId || null,
        fbPixelId: fbPixelId || null,
        captchaSiteKey: captchaSiteKey || null,
        captchaSecretKey: captchaSecretKey || null,
        translationApiKey: translationApiKey || null,
        headScripts: headScripts || null,
        bodyScripts: bodyScripts || null,
      });
      if (res.success) {
        toast.success('脚本配置已保存');
      } else {
        toast.error(typeof res.error === 'string' ? res.error : '保存失败');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">脚本注入</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置分析工具和自定义脚本，会自动注入到前台页面
          </p>
        </div>
        
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold">分析工具</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Google Analytics ID</label>
            <Input
              value={gaId}
              onChange={(e) => setGaId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Google Tag Manager ID</label>
            <Input
              value={gtmId}
              onChange={(e) => setGtmId(e.target.value)}
              placeholder="GTM-XXXXXXX"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Facebook Pixel ID</label>
            <Input
              value={fbPixelId}
              onChange={(e) => setFbPixelId(e.target.value)}
              placeholder="123456789012345"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold pt-2">防垃圾验证（hCaptcha）</h2>
        <p className="text-sm text-muted-foreground -mt-4">
          配置后，询盘表单提交前将自动进行人机验证
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Site Key</label>
            <Input
              value={captchaSiteKey}
              onChange={(e) => setCaptchaSiteKey(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Secret Key</label>
            <Input
              type="password"
              value={captchaSecretKey}
              onChange={(e) => setCaptchaSecretKey(e.target.value)}
              placeholder="0x..."
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold pt-2">自动翻译（Azure Translator）</h2>
        <p className="text-sm text-muted-foreground -mt-4">
          配置后，可在产品/页面/UI 翻译管理中使用一键翻译功能
        </p>
        <div>
          <label className="text-sm font-medium mb-1 block">API Key</label>
          <Input
            type="password"
            value={translationApiKey}
            onChange={(e) => setTranslationApiKey(e.target.value)}
            placeholder="Azure Translator API Key"
          />
        </div>

        <h2 className="text-lg font-semibold pt-2">自定义脚本</h2>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Head 脚本
            <span className="text-xs text-muted-foreground ml-2">
              注入到 &lt;head&gt; 标签内
            </span>
          </label>
          <textarea
            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] font-mono"
            value={headScripts}
            onChange={(e) => setHeadScripts(e.target.value)}
            placeholder="<!-- Custom head scripts -->"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Body 脚本
            <span className="text-xs text-muted-foreground ml-2">
              注入到 &lt;body&gt; 标签末尾
            </span>
          </label>
          <textarea
            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] font-mono"
            value={bodyScripts}
            onChange={(e) => setBodyScripts(e.target.value)}
            placeholder="<!-- Custom body scripts -->"
          />
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          保存
        </Button>
      </div>
    </div>
  );
}

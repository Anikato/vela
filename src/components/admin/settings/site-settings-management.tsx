'use client';

import { useState, useTransition } from 'react';
import { Save, ImageIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  updateSiteSettingsAction,
  upsertSettingTranslationAction,
} from '@/server/actions/settings.actions';
import type { SiteSettingsData, SiteSettingTranslationRow } from '@/server/services/settings-admin.service';

interface Language {
  code: string;
  name: string;
}

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
}

interface Props {
  initialSettings: SiteSettingsData;
  languages: Language[];
  mediaItems: MediaItem[];
}

function ImagePicker({
  label,
  currentUrl,
  mediaItems,
  onSelect,
  onClear,
}: {
  label: string;
  currentUrl: string | null;
  mediaItems: MediaItem[];
  onSelect: (id: string, url: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const images = mediaItems.filter((m) => m.mimeType.startsWith('image/'));

  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="relative w-20 h-20 rounded-md border overflow-hidden bg-muted">
            <img src={currentUrl} alt="" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={onClear}
              className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ) : (
          <div
            className="w-20 h-20 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setOpen(true)}
          >
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          {currentUrl ? '更换' : '选择'}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>选择{label}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                className="rounded-md border overflow-hidden hover:ring-2 hover:ring-primary transition-all aspect-square"
                onClick={() => {
                  onSelect(img.id, img.url);
                  setOpen(false);
                }}
              >
                <img src={img.url} alt={img.originalName} className="w-full h-full object-cover" />
              </button>
            ))}
            {images.length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-8">
                媒体库中没有图片，请先上传
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SiteSettingsManagement({ initialSettings, languages, mediaItems }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [logoDarkUrl, setLogoDarkUrl] = useState(settings.logoDarkUrl);
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl);
  const [ogImageUrl, setOgImageUrl] = useState(settings.ogImageUrl);

  const [translations, setTranslations] = useState<Record<string, SiteSettingTranslationRow>>(() => {
    const map: Record<string, SiteSettingTranslationRow> = {};
    for (const t of settings.translations) {
      map[t.locale] = t;
    }
    return map;
  });

  function getTrans(locale: string): SiteSettingTranslationRow {
    return (
      translations[locale] ?? {
        locale,
        siteName: null,
        siteDescription: null,
        companyName: null,
        slogan: null,
        address: null,
        footerText: null,
        copyright: null,
        contactCta: null,
        seoKeywords: null,
      }
    );
  }

  function setTrans(locale: string, key: keyof Omit<SiteSettingTranslationRow, 'locale'>, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...getTrans(locale), [key]: value || null },
    }));
  }

  function handleSaveGeneral() {
    startTransition(async () => {
      const res = await updateSiteSettingsAction({
        logoId: settings.logoId,
        logoDarkId: settings.logoDarkId,
        faviconId: settings.faviconId,
        ogImageId: settings.ogImageId,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        contactFax: settings.contactFax,
        whatsapp: settings.whatsapp,
        wechat: settings.wechat,
        telegram: settings.telegram,
        line: settings.line,
        socialFacebook: settings.socialFacebook,
        socialLinkedin: settings.socialLinkedin,
        socialYoutube: settings.socialYoutube,
        socialInstagram: settings.socialInstagram,
        socialPinterest: settings.socialPinterest,
        socialAlibaba: settings.socialAlibaba,
        establishedYear: settings.establishedYear,
        businessHours: settings.businessHours,
        timezone: settings.timezone,
        mapCoordinates: settings.mapCoordinates,
        mapEmbedCode: settings.mapEmbedCode,
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function handleSaveTranslation(locale: string) {
    const t = getTrans(locale);
    startTransition(async () => {
      const res = await upsertSettingTranslationAction({
        locale,
        siteName: t.siteName,
        siteDescription: t.siteDescription,
        companyName: t.companyName,
        slogan: t.slogan,
        address: t.address,
        footerText: t.footerText,
        copyright: t.copyright,
        contactCta: t.contactCta,
        seoKeywords: t.seoKeywords,
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function updateField(key: keyof SiteSettingsData, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">站点设置</h1>
          <p className="text-sm text-muted-foreground mt-1">配置站点基础信息和品牌形象</p>
        </div>
        {saved && (
          <span className="text-sm text-green-400">已保存</span>
        )}
      </div>

      <Tabs defaultValue="brand">
        <TabsList>
          <TabsTrigger value="brand">品牌 & Logo</TabsTrigger>
          <TabsTrigger value="contact">联系方式</TabsTrigger>
          <TabsTrigger value="social">社交媒体</TabsTrigger>
          <TabsTrigger value="company">公司信息</TabsTrigger>
          <TabsTrigger value="i18n">多语言字段</TabsTrigger>
        </TabsList>

        {/* 品牌 & Logo */}
        <TabsContent value="brand" className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <ImagePicker
              label="Logo（浅色背景）"
              currentUrl={logoUrl}
              mediaItems={mediaItems}
              onSelect={(id, url) => { updateField('logoId', id); setLogoUrl(url); }}
              onClear={() => { updateField('logoId', null); setLogoUrl(null); }}
            />
            <ImagePicker
              label="Logo（深色背景）"
              currentUrl={logoDarkUrl}
              mediaItems={mediaItems}
              onSelect={(id, url) => { updateField('logoDarkId', id); setLogoDarkUrl(url); }}
              onClear={() => { updateField('logoDarkId', null); setLogoDarkUrl(null); }}
            />
            <ImagePicker
              label="Favicon"
              currentUrl={faviconUrl}
              mediaItems={mediaItems}
              onSelect={(id, url) => { updateField('faviconId', id); setFaviconUrl(url); }}
              onClear={() => { updateField('faviconId', null); setFaviconUrl(null); }}
            />
            <ImagePicker
              label="OG 分享图片"
              currentUrl={ogImageUrl}
              mediaItems={mediaItems}
              onSelect={(id, url) => { updateField('ogImageId', id); setOgImageUrl(url); }}
              onClear={() => { updateField('ogImageId', null); setOgImageUrl(null); }}
            />
          </div>
          <Button onClick={handleSaveGeneral} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </TabsContent>

        {/* 联系方式 */}
        <TabsContent value="contact" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">联系邮箱</label>
              <Input
                value={settings.contactEmail ?? ''}
                onChange={(e) => updateField('contactEmail', e.target.value || null)}
                placeholder="info@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">联系电话</label>
              <Input
                value={settings.contactPhone ?? ''}
                onChange={(e) => updateField('contactPhone', e.target.value || null)}
                placeholder="+86-21-12345678"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">传真</label>
              <Input
                value={settings.contactFax ?? ''}
                onChange={(e) => updateField('contactFax', e.target.value || null)}
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold pt-2">即时通讯</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">WhatsApp</label>
              <Input
                value={settings.whatsapp ?? ''}
                onChange={(e) => updateField('whatsapp', e.target.value || null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">WeChat</label>
              <Input
                value={settings.wechat ?? ''}
                onChange={(e) => updateField('wechat', e.target.value || null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Telegram</label>
              <Input
                value={settings.telegram ?? ''}
                onChange={(e) => updateField('telegram', e.target.value || null)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">LINE</label>
              <Input
                value={settings.line ?? ''}
                onChange={(e) => updateField('line', e.target.value || null)}
              />
            </div>
          </div>
          <Button onClick={handleSaveGeneral} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </TabsContent>

        {/* 社交媒体 */}
        <TabsContent value="social" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {([
              ['socialFacebook', 'Facebook'],
              ['socialLinkedin', 'LinkedIn'],
              ['socialYoutube', 'YouTube'],
              ['socialInstagram', 'Instagram'],
              ['socialPinterest', 'Pinterest'],
              ['socialAlibaba', 'Alibaba'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-sm font-medium mb-1 block">{label}</label>
                <Input
                  value={(settings[key] as string) ?? ''}
                  onChange={(e) => updateField(key, e.target.value || null)}
                  placeholder={`https://${label.toLowerCase()}.com/...`}
                />
              </div>
            ))}
          </div>
          <Button onClick={handleSaveGeneral} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </TabsContent>

        {/* 公司信息 */}
        <TabsContent value="company" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">成立年份</label>
              <Input
                type="number"
                value={settings.establishedYear ?? ''}
                onChange={(e) =>
                  updateField('establishedYear', e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="2010"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">营业时间</label>
              <Input
                value={settings.businessHours ?? ''}
                onChange={(e) => updateField('businessHours', e.target.value || null)}
                placeholder="Mon-Fri 9:00-18:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">时区</label>
              <Input
                value={settings.timezone ?? ''}
                onChange={(e) => updateField('timezone', e.target.value || null)}
                placeholder="Asia/Shanghai"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">地图坐标</label>
              <Input
                value={settings.mapCoordinates ?? ''}
                onChange={(e) => updateField('mapCoordinates', e.target.value || null)}
                placeholder="31.2304, 121.4737"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Google Maps 嵌入代码</label>
            <textarea
              className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] font-mono"
              value={settings.mapEmbedCode ?? ''}
              onChange={(e) => updateField('mapEmbedCode', e.target.value || null)}
              placeholder='<iframe src="..." ...></iframe>'
            />
          </div>
          <Button onClick={handleSaveGeneral} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </TabsContent>

        {/* 多语言字段 */}
        <TabsContent value="i18n" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            为每种语言配置站点名称、公司名等面向访客的文本
          </p>

          <Tabs defaultValue={languages[0]?.code}>
            <TabsList className="flex-wrap">
              {languages.map((lang) => (
                <TabsTrigger key={lang.code} value={lang.code}>
                  {lang.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {languages.map((lang) => {
              const t = getTrans(lang.code);
              return (
                <TabsContent key={lang.code} value={lang.code} className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">站点名称</label>
                      <Input
                        value={t.siteName ?? ''}
                        onChange={(e) => setTrans(lang.code, 'siteName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">公司名</label>
                      <Input
                        value={t.companyName ?? ''}
                        onChange={(e) => setTrans(lang.code, 'companyName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">站点描述</label>
                    <textarea
                      className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
                      value={t.siteDescription ?? ''}
                      onChange={(e) => setTrans(lang.code, 'siteDescription', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">口号 / Slogan</label>
                      <Input
                        value={t.slogan ?? ''}
                        onChange={(e) => setTrans(lang.code, 'slogan', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">联系行动号召</label>
                      <Input
                        value={t.contactCta ?? ''}
                        onChange={(e) => setTrans(lang.code, 'contactCta', e.target.value)}
                        placeholder="联系我们获取报价"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">地址</label>
                    <Input
                      value={t.address ?? ''}
                      onChange={(e) => setTrans(lang.code, 'address', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">页脚文字</label>
                      <Input
                        value={t.footerText ?? ''}
                        onChange={(e) => setTrans(lang.code, 'footerText', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">版权信息</label>
                      <Input
                        value={t.copyright ?? ''}
                        onChange={(e) => setTrans(lang.code, 'copyright', e.target.value)}
                        placeholder="© 2024 Company Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">SEO 关键词</label>
                    <Input
                      value={t.seoKeywords ?? ''}
                      onChange={(e) => setTrans(lang.code, 'seoKeywords', e.target.value)}
                      placeholder="关键词1, 关键词2, 关键词3"
                    />
                  </div>
                  <Button
                    onClick={() => handleSaveTranslation(lang.code)}
                    disabled={isPending}
                    size="sm"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    保存 {lang.name}
                  </Button>
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { decryptSecret } from '@/lib/crypto';
import { db } from '@/server/db';

// ─── Types ───

export interface TranslateRequest {
  texts: string[];
  from: string;
  to: string[];
}

export interface TranslateResult {
  /** Map: targetLocale → translated texts (same order as input) */
  translations: Record<string, string[]>;
}

// ─── Azure Translator ───

interface AzureConfig {
  apiKey: string;
  region?: string;
}

async function getAzureConfig(): Promise<AzureConfig | null> {
  const row = await db.query.siteSettings.findFirst();
  if (!row?.translationApiKey) return null;
  return { apiKey: decryptSecret(row.translationApiKey), region: 'global' };
}

/** 获取语言的 Azure Translator 代码映射 */
async function getAzureLocaleCode(locale: string): Promise<string> {
  const lang = await db.query.languages.findFirst({
    where: (t, { eq }) => eq(t.code, locale),
  });
  return lang?.azureCode || locale.split('-')[0];
}

async function getAzureLocaleCodes(locales: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const langs = await db.query.languages.findMany();
  for (const locale of locales) {
    const lang = langs.find((l) => l.code === locale);
    result[locale] = lang?.azureCode || locale.split('-')[0];
  }
  return result;
}

interface AzureTranslation {
  translations: Array<{ text: string; to: string }>;
}

/**
 * 调用 Azure Translator API 批量翻译
 * 每次最多 50 条文本，API 限制
 */
export async function translateTexts(request: TranslateRequest): Promise<TranslateResult> {
  const config = await getAzureConfig();
  if (!config) throw new Error('翻译 API 未配置，请在系统设置中填写 API Key');

  if (request.texts.length === 0 || request.to.length === 0) {
    return { translations: {} };
  }

  const fromCode = await getAzureLocaleCode(request.from);
  const toCodes = await getAzureLocaleCodes(request.to);

  const azureToParams = request.to.map((locale) => toCodes[locale]);
  const toQuery = azureToParams.map((c) => `to=${c}`).join('&');

  const result: TranslateResult = { translations: {} };
  for (const locale of request.to) {
    result.translations[locale] = [];
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < request.texts.length; i += BATCH_SIZE) {
    const batch = request.texts.slice(i, i + BATCH_SIZE);
    const body = batch.map((text) => ({ Text: text }));

    const res = await fetch(
      `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${fromCode}&${toQuery}`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Azure Translator API error (${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as AzureTranslation[];

    for (const item of data) {
      for (const translation of item.translations) {
        const locale = request.to.find((l) => toCodes[l] === translation.to);
        if (locale) {
          result.translations[locale].push(translation.text);
        }
      }
    }
  }

  return result;
}

/**
 * 翻译单段文本到多个目标语言
 * 方便在编辑界面使用
 */
export async function translateSingle(
  text: string,
  from: string,
  to: string[],
): Promise<Record<string, string>> {
  if (!text.trim()) {
    const result: Record<string, string> = {};
    for (const locale of to) result[locale] = '';
    return result;
  }

  const res = await translateTexts({ texts: [text], from, to });
  const result: Record<string, string> = {};
  for (const locale of to) {
    result[locale] = res.translations[locale]?.[0] ?? '';
  }
  return result;
}

/**
 * 语言标准库
 * - canonicalCode: 项目内部统一语言代码（BCP 47 风格）
 * - azureCode/googleCode: 自动翻译供应商映射代码
 */
export interface LanguagePreset {
  canonicalCode: string;
  englishName: string;
  nativeName: string;
  chineseName: string;
  isRtl: boolean;
  azureCode: string;
  googleCode: string;
}

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  {
    canonicalCode: 'en-US',
    englishName: 'English (United States)',
    nativeName: 'English (United States)',
    chineseName: '英语（美国）',
    isRtl: false,
    azureCode: 'en',
    googleCode: 'en',
  },
  {
    canonicalCode: 'zh-CN',
    englishName: 'Chinese (Simplified)',
    nativeName: '简体中文',
    chineseName: '中文（简体）',
    isRtl: false,
    azureCode: 'zh-Hans',
    googleCode: 'zh-CN',
  },
  {
    canonicalCode: 'zh-TW',
    englishName: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    chineseName: '中文（繁体）',
    isRtl: false,
    azureCode: 'zh-Hant',
    googleCode: 'zh-TW',
  },
  {
    canonicalCode: 'es-ES',
    englishName: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    chineseName: '西班牙语（西班牙）',
    isRtl: false,
    azureCode: 'es',
    googleCode: 'es',
  },
  {
    canonicalCode: 'fr-FR',
    englishName: 'French (France)',
    nativeName: 'Français (France)',
    chineseName: '法语（法国）',
    isRtl: false,
    azureCode: 'fr',
    googleCode: 'fr',
  },
  {
    canonicalCode: 'de-DE',
    englishName: 'German (Germany)',
    nativeName: 'Deutsch (Deutschland)',
    chineseName: '德语（德国）',
    isRtl: false,
    azureCode: 'de',
    googleCode: 'de',
  },
  {
    canonicalCode: 'it-IT',
    englishName: 'Italian (Italy)',
    nativeName: 'Italiano (Italia)',
    chineseName: '意大利语（意大利）',
    isRtl: false,
    azureCode: 'it',
    googleCode: 'it',
  },
  {
    canonicalCode: 'pt-BR',
    englishName: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    chineseName: '葡萄牙语（巴西）',
    isRtl: false,
    azureCode: 'pt',
    googleCode: 'pt',
  },
  {
    canonicalCode: 'ru-RU',
    englishName: 'Russian (Russia)',
    nativeName: 'Русский (Россия)',
    chineseName: '俄语（俄罗斯）',
    isRtl: false,
    azureCode: 'ru',
    googleCode: 'ru',
  },
  {
    canonicalCode: 'ja-JP',
    englishName: 'Japanese (Japan)',
    nativeName: '日本語（日本）',
    chineseName: '日语（日本）',
    isRtl: false,
    azureCode: 'ja',
    googleCode: 'ja',
  },
  {
    canonicalCode: 'ko-KR',
    englishName: 'Korean (Korea)',
    nativeName: '한국어 (대한민국)',
    chineseName: '韩语（韩国）',
    isRtl: false,
    azureCode: 'ko',
    googleCode: 'ko',
  },
  {
    canonicalCode: 'ar-SA',
    englishName: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (السعودية)',
    chineseName: '阿拉伯语（沙特阿拉伯）',
    isRtl: true,
    azureCode: 'ar',
    googleCode: 'ar',
  },
  {
    canonicalCode: 'tr-TR',
    englishName: 'Turkish (Turkey)',
    nativeName: 'Türkçe (Türkiye)',
    chineseName: '土耳其语（土耳其）',
    isRtl: false,
    azureCode: 'tr',
    googleCode: 'tr',
  },
  {
    canonicalCode: 'vi-VN',
    englishName: 'Vietnamese (Vietnam)',
    nativeName: 'Tiếng Việt (Việt Nam)',
    chineseName: '越南语（越南）',
    isRtl: false,
    azureCode: 'vi',
    googleCode: 'vi',
  },
  {
    canonicalCode: 'th-TH',
    englishName: 'Thai (Thailand)',
    nativeName: 'ไทย (ไทย)',
    chineseName: '泰语（泰国）',
    isRtl: false,
    azureCode: 'th',
    googleCode: 'th',
  },
  {
    canonicalCode: 'id-ID',
    englishName: 'Indonesian (Indonesia)',
    nativeName: 'Bahasa Indonesia (Indonesia)',
    chineseName: '印度尼西亚语（印度尼西亚）',
    isRtl: false,
    azureCode: 'id',
    googleCode: 'id',
  },
  {
    canonicalCode: 'pl-PL',
    englishName: 'Polish (Poland)',
    nativeName: 'Polski (Polska)',
    chineseName: '波兰语（波兰）',
    isRtl: false,
    azureCode: 'pl',
    googleCode: 'pl',
  },
  {
    canonicalCode: 'nl-NL',
    englishName: 'Dutch (Netherlands)',
    nativeName: 'Nederlands (Nederland)',
    chineseName: '荷兰语（荷兰）',
    isRtl: false,
    azureCode: 'nl',
    googleCode: 'nl',
  },
  {
    canonicalCode: 'sv-SE',
    englishName: 'Swedish (Sweden)',
    nativeName: 'Svenska (Sverige)',
    chineseName: '瑞典语（瑞典）',
    isRtl: false,
    azureCode: 'sv',
    googleCode: 'sv',
  },
  {
    canonicalCode: 'cs-CZ',
    englishName: 'Czech (Czechia)',
    nativeName: 'Čeština (Česko)',
    chineseName: '捷克语（捷克）',
    isRtl: false,
    azureCode: 'cs',
    googleCode: 'cs',
  },
  {
    canonicalCode: 'hu-HU',
    englishName: 'Hungarian (Hungary)',
    nativeName: 'Magyar (Magyarország)',
    chineseName: '匈牙利语（匈牙利）',
    isRtl: false,
    azureCode: 'hu',
    googleCode: 'hu',
  },
  {
    canonicalCode: 'ro-RO',
    englishName: 'Romanian (Romania)',
    nativeName: 'Română (România)',
    chineseName: '罗马尼亚语（罗马尼亚）',
    isRtl: false,
    azureCode: 'ro',
    googleCode: 'ro',
  },
  {
    canonicalCode: 'el-GR',
    englishName: 'Greek (Greece)',
    nativeName: 'Ελληνικά (Ελλάδα)',
    chineseName: '希腊语（希腊）',
    isRtl: false,
    azureCode: 'el',
    googleCode: 'el',
  },
  {
    canonicalCode: 'he-IL',
    englishName: 'Hebrew (Israel)',
    nativeName: 'עברית (ישראל)',
    chineseName: '希伯来语（以色列）',
    isRtl: true,
    azureCode: 'he',
    googleCode: 'he',
  },
  {
    canonicalCode: 'uk-UA',
    englishName: 'Ukrainian (Ukraine)',
    nativeName: 'Українська (Україна)',
    chineseName: '乌克兰语（乌克兰）',
    isRtl: false,
    azureCode: 'uk',
    googleCode: 'uk',
  },
  {
    canonicalCode: 'hr-HR',
    englishName: 'Croatian (Croatia)',
    nativeName: 'Hrvatski (Hrvatska)',
    chineseName: '克罗地亚语（克罗地亚）',
    isRtl: false,
    azureCode: 'hr',
    googleCode: 'hr',
  },
];

const PRESET_MAP = new Map(
  LANGUAGE_PRESETS.map((preset) => [preset.canonicalCode.toLowerCase(), preset]),
);

/**
 * 统一语言代码格式，尽量兼容常见 BCP 47 写法
 */
export function normalizeLanguageCode(rawCode: string): string {
  const trimmed = rawCode.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split('-').filter(Boolean);
  if (parts.length === 0) return trimmed;

  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.toLowerCase();
      }

      if (/^[a-zA-Z]{4}$/.test(part)) {
        return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
      }

      if (/^[a-zA-Z]{2}$/.test(part) || /^[0-9]{3}$/.test(part)) {
        return part.toUpperCase();
      }

      return part;
    })
    .join('-');
}

export function getLanguagePresetByCode(code: string): LanguagePreset | undefined {
  const normalized = normalizeLanguageCode(code);
  return PRESET_MAP.get(normalized.toLowerCase());
}

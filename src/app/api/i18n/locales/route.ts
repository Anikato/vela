import { NextResponse } from 'next/server';

import { createLogger } from '@/lib/logger';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';

export async function GET() {
  try {
    const [activeLanguages, defaultLanguage] = await Promise.all([
      getActiveLanguages(),
      getDefaultLanguage(),
    ]);

    const activeLocales = activeLanguages.map((item) => item.code);
    const defaultLocale = defaultLanguage.code;

    // 确保默认语言始终可用（即使异常停用，也加入返回列表）
    const normalizedActiveLocales = activeLocales.includes(defaultLocale)
      ? activeLocales
      : [defaultLocale, ...activeLocales];

    return NextResponse.json({
      success: true,
      data: {
        defaultLocale,
        activeLocales: normalizedActiveLocales,
      },
    });
  } catch (error) {
    createLogger('api.i18n').error({ err: error }, 'Load i18n locales API failed');
    return NextResponse.json(
      { success: false, error: 'Failed to load locale config' },
      { status: 500 },
    );
  }
}

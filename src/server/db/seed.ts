/**
 * 数据库种子脚本
 * 运行：pnpm db:seed
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'bcryptjs';
import { languages, uiTranslations, users } from './schema';

const connectionString = process.env.DATABASE_URL!;
const conn = postgres(connectionString);
const db = drizzle(conn);

const seedLanguages = [
  {
    code: 'en-US',
    englishName: 'English',
    nativeName: 'English',
    chineseName: '英语（美国）',
    azureCode: 'en',
    googleCode: 'en',
    isRtl: false,
    isDefault: true,
    isActive: true,
    sortOrder: 0,
  },
  {
    code: 'zh-CN',
    englishName: 'Chinese (Simplified)',
    nativeName: '简体中文',
    chineseName: '中文（简体）',
    azureCode: 'zh-Hans',
    googleCode: 'zh-CN',
    isRtl: false,
    isDefault: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'es-ES',
    englishName: 'Spanish',
    nativeName: 'Español',
    chineseName: '西班牙语（西班牙）',
    azureCode: 'es',
    googleCode: 'es',
    isRtl: false,
    isDefault: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    code: 'ar-SA',
    englishName: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (السعودية)',
    chineseName: '阿拉伯语（沙特阿拉伯）',
    azureCode: 'ar',
    googleCode: 'ar',
    isRtl: true,
    isDefault: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    code: 'ja-JP',
    englishName: 'Japanese (Japan)',
    nativeName: '日本語（日本）',
    chineseName: '日语（日本）',
    azureCode: 'ja',
    googleCode: 'ja',
    isRtl: false,
    isDefault: false,
    isActive: false,
    sortOrder: 4,
  },
];

/** 默认管理员账号（支持环境变量覆盖） */
const defaultAdmin = {
  email: process.env.ADMIN_EMAIL ?? 'admin@vela.com',
  password: process.env.ADMIN_PASSWORD ?? 'admin123',
  name: process.env.ADMIN_NAME ?? 'admin',
};

const seedUiTranslations = [
  {
    key: 'cookie.title',
    category: 'cookie',
    locale: 'en-US',
    value: 'Cookie preferences',
  },
  {
    key: 'cookie.description',
    category: 'cookie',
    locale: 'en-US',
    value: 'We use cookies to improve your browsing experience.',
  },
  {
    key: 'cookie.accept',
    category: 'cookie',
    locale: 'en-US',
    value: 'Accept',
  },
  {
    key: 'cookie.reject',
    category: 'cookie',
    locale: 'en-US',
    value: 'Reject',
  },
  {
    key: 'cookie.title',
    category: 'cookie',
    locale: 'zh-CN',
    value: 'Cookie 偏好设置',
  },
  {
    key: 'cookie.description',
    category: 'cookie',
    locale: 'zh-CN',
    value: '我们使用 Cookie 来优化你的浏览体验。',
  },
  {
    key: 'cookie.accept',
    category: 'cookie',
    locale: 'zh-CN',
    value: '接受',
  },
  {
    key: 'cookie.reject',
    category: 'cookie',
    locale: 'zh-CN',
    value: '拒绝',
  },
];

async function seed() {
  // 语言数据
  console.log('Seeding languages...');
  for (const lang of seedLanguages) {
    await db.insert(languages).values(lang).onConflictDoNothing();
    console.log(`  ✓ ${lang.code} — ${lang.englishName}`);
  }

  // UI 翻译数据
  console.log('\nSeeding UI translations...');
  for (const item of seedUiTranslations) {
    await db.insert(uiTranslations).values(item).onConflictDoNothing();
    console.log(`  ✓ ${item.locale} — ${item.key}`);
  }

  // 管理员账号
  console.log('\nSeeding admin user...');
  const passwordHash = await hash(defaultAdmin.password, 12);
  await db
    .insert(users)
    .values({
      email: defaultAdmin.email,
      passwordHash,
      name: defaultAdmin.name,
      role: 'admin',
    })
    .onConflictDoNothing();
  console.log(`  ✓ ${defaultAdmin.email} (密码: ${defaultAdmin.password})`);

  console.log('\nDone!');
  await conn.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

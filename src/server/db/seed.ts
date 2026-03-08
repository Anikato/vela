/**
 * 数据库种子脚本 — 完整的 B2B 网站预设数据
 * 运行：pnpm db:seed
 *
 * 包含：
 *  1. 语言配置
 *  2. 管理员账号
 *  3. 全部 UI 翻译键（en-US + zh-CN）
 *  4. 站点设置 + 多语言公司信息
 *  5. 预设页面（首页 + 关于我们）+ 区块 + 区块子项
 *  6. 导航菜单
 *  7. 示例产品分类
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import {
  languages,
  uiTranslations,
  users,
  pages,
  pageTranslations,
  sections,
  sectionTranslations,
  sectionItems,
  sectionItemTranslations,
  navigationItems,
  navigationItemTranslations,
  siteSettings,
  siteSettingTranslations,
  categories,
  categoryTranslations,
} from './schema';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const conn = postgres(connectionString);
const db = drizzle(conn, { schema });

/* ================================================================
 * 1. 语言配置
 * ================================================================*/

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

/* ================================================================
 * 2. 管理员账号
 * ================================================================*/

const defaultAdmin = {
  email: process.env.ADMIN_EMAIL ?? 'admin@vela.com',
  password: process.env.ADMIN_PASSWORD ?? 'admin123',
  name: process.env.ADMIN_NAME ?? 'admin',
};

/* ================================================================
 * 3. UI 翻译键值对 — 覆盖网站所有前端显示文本
 * ================================================================*/

interface UiTranslationSeed {
  key: string;
  category: string;
  'en-US': string;
  'zh-CN': string;
}

const uiTranslationSeeds: UiTranslationSeed[] = [
  // ─── Cookie ───
  { key: 'cookie.title', category: 'cookie', 'en-US': 'Cookie Preferences', 'zh-CN': 'Cookie 偏好设置' },
  { key: 'cookie.description', category: 'cookie', 'en-US': 'We use cookies to improve your browsing experience. You can accept or reject non-essential cookies.', 'zh-CN': '我们使用 Cookie 来优化您的浏览体验。您可以选择接受或拒绝非必要的 Cookie。' },
  { key: 'cookie.accept', category: 'cookie', 'en-US': 'Accept', 'zh-CN': '接受' },
  { key: 'cookie.reject', category: 'cookie', 'en-US': 'Reject', 'zh-CN': '拒绝' },

  // ─── Common ───
  { key: 'common.close', category: 'common', 'en-US': 'Close', 'zh-CN': '关闭' },
  { key: 'common.cancel', category: 'common', 'en-US': 'Cancel', 'zh-CN': '取消' },
  { key: 'common.submit', category: 'common', 'en-US': 'Submit', 'zh-CN': '提交' },
  { key: 'common.loading', category: 'common', 'en-US': 'Loading...', 'zh-CN': '加载中...' },
  { key: 'common.previous', category: 'common', 'en-US': 'Previous', 'zh-CN': '上一页' },
  { key: 'common.next', category: 'common', 'en-US': 'Next', 'zh-CN': '下一页' },

  // ─── Navigation ───
  { key: 'nav.home', category: 'nav', 'en-US': 'Home', 'zh-CN': '首页' },
  { key: 'nav.products', category: 'nav', 'en-US': 'Products', 'zh-CN': '产品' },
  { key: 'nav.about', category: 'nav', 'en-US': 'About Us', 'zh-CN': '关于我们' },
  { key: 'nav.news', category: 'nav', 'en-US': 'News', 'zh-CN': '新闻动态' },
  { key: 'nav.contact', category: 'nav', 'en-US': 'Contact', 'zh-CN': '联系我们' },

  // ─── Search ───
  { key: 'search.placeholder', category: 'search', 'en-US': 'Search products...', 'zh-CN': '搜索产品...' },
  { key: 'search.button', category: 'search', 'en-US': 'Search', 'zh-CN': '搜索' },
  { key: 'search.noResults', category: 'search', 'en-US': 'No products found matching your search.', 'zh-CN': '未找到匹配的产品。' },
  { key: 'search.resultCount', category: 'search', 'en-US': '{count} product(s) found', 'zh-CN': '找到 {count} 个产品' },

  // ─── Products ───
  { key: 'product.allProducts', category: 'product', 'en-US': 'All Products', 'zh-CN': '全部产品' },
  { key: 'product.sortNewest', category: 'product', 'en-US': 'Newest', 'zh-CN': '最新' },
  { key: 'product.sortPopular', category: 'product', 'en-US': 'Most Popular', 'zh-CN': '最受欢迎' },
  { key: 'product.sortNameAsc', category: 'product', 'en-US': 'Name A-Z', 'zh-CN': '名称 A-Z' },
  { key: 'product.sortNameDesc', category: 'product', 'en-US': 'Name Z-A', 'zh-CN': '名称 Z-A' },
  { key: 'product.noProducts', category: 'product', 'en-US': 'No products found in this category.', 'zh-CN': '该分类下暂无产品。' },
  { key: 'product.totalCount', category: 'product', 'en-US': '{count} product(s)', 'zh-CN': '{count} 个产品' },
  { key: 'product.categories', category: 'product', 'en-US': 'Categories', 'zh-CN': '产品分类' },
  { key: 'product.addToInquiry', category: 'product', 'en-US': 'Add to Inquiry', 'zh-CN': '加入询盘' },
  { key: 'product.sendInquiry', category: 'product', 'en-US': 'Send Inquiry', 'zh-CN': '发送询盘' },
  { key: 'product.relatedProducts', category: 'product', 'en-US': 'Related Products', 'zh-CN': '相关产品' },
  { key: 'product.specifications', category: 'product', 'en-US': 'Specifications', 'zh-CN': '产品参数' },
  { key: 'product.videos', category: 'product', 'en-US': 'Videos', 'zh-CN': '视频' },
  { key: 'product.attachments', category: 'product', 'en-US': 'Downloads', 'zh-CN': '下载资料' },
  { key: 'product.moq', category: 'product', 'en-US': 'MOQ', 'zh-CN': '最小起订量' },
  { key: 'product.leadTime', category: 'product', 'en-US': 'Lead Time', 'zh-CN': '交货周期' },
  { key: 'product.tradeTerms', category: 'product', 'en-US': 'Trade Terms', 'zh-CN': '贸易条款' },
  { key: 'product.paymentTerms', category: 'product', 'en-US': 'Payment Terms', 'zh-CN': '付款方式' },
  { key: 'product.packaging', category: 'product', 'en-US': 'Packaging', 'zh-CN': '包装信息' },
  { key: 'product.customization', category: 'product', 'en-US': 'Customization', 'zh-CN': '定制服务' },
  { key: 'product.customizationYes', category: 'product', 'en-US': 'Available', 'zh-CN': '支持定制' },
  { key: 'product.customizationNo', category: 'product', 'en-US': 'Not Available', 'zh-CN': '不支持定制' },
  { key: 'product.days', category: 'product', 'en-US': 'days', 'zh-CN': '天' },
  { key: 'product.viewDetails', category: 'product', 'en-US': 'View Details', 'zh-CN': '查看详情' },

  // ─── Inquiry ───
  { key: 'inquiry.basketTitle', category: 'inquiry', 'en-US': 'Inquiry Basket', 'zh-CN': '询盘篮' },
  { key: 'inquiry.basketEmpty', category: 'inquiry', 'en-US': 'Your inquiry basket is empty.', 'zh-CN': '您的询盘篮为空。' },
  { key: 'inquiry.submitInquiry', category: 'inquiry', 'en-US': 'Submit Inquiry', 'zh-CN': '提交询盘' },
  { key: 'inquiry.clearAll', category: 'inquiry', 'en-US': 'Clear All', 'zh-CN': '清空全部' },
  { key: 'inquiry.formTitle', category: 'inquiry', 'en-US': 'Send Inquiry', 'zh-CN': '发送询盘' },
  { key: 'inquiry.name', category: 'inquiry', 'en-US': 'Your Name', 'zh-CN': '您的姓名' },
  { key: 'inquiry.email', category: 'inquiry', 'en-US': 'Email Address', 'zh-CN': '电子邮箱' },
  { key: 'inquiry.phone', category: 'inquiry', 'en-US': 'Phone Number', 'zh-CN': '电话号码' },
  { key: 'inquiry.company', category: 'inquiry', 'en-US': 'Company Name', 'zh-CN': '公司名称' },
  { key: 'inquiry.country', category: 'inquiry', 'en-US': 'Country / Region', 'zh-CN': '国家/地区' },
  { key: 'inquiry.message', category: 'inquiry', 'en-US': 'Your Message', 'zh-CN': '留言内容' },
  { key: 'inquiry.submit', category: 'inquiry', 'en-US': 'Send', 'zh-CN': '发送' },
  { key: 'inquiry.success', category: 'inquiry', 'en-US': 'Your inquiry has been sent successfully! We will get back to you within 24 hours.', 'zh-CN': '您的询盘已成功发送！我们将在 24 小时内回复您。' },
  { key: 'inquiry.error', category: 'inquiry', 'en-US': 'Failed to send inquiry. Please try again later.', 'zh-CN': '发送询盘失败，请稍后重试。' },

  // ─── Contact ───
  { key: 'contact.title', category: 'contact', 'en-US': 'Contact Us', 'zh-CN': '联系我们' },
  { key: 'contact.subtitle', category: 'contact', 'en-US': 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.', 'zh-CN': '有任何问题？欢迎联系我们。给我们留言，我们会尽快回复您。' },
  { key: 'contact.nameLabel', category: 'contact', 'en-US': 'Full Name', 'zh-CN': '姓名' },
  { key: 'contact.namePlaceholder', category: 'contact', 'en-US': 'Enter your full name', 'zh-CN': '请输入您的姓名' },
  { key: 'contact.emailLabel', category: 'contact', 'en-US': 'Email', 'zh-CN': '邮箱' },
  { key: 'contact.emailPlaceholder', category: 'contact', 'en-US': 'Enter your email address', 'zh-CN': '请输入您的邮箱地址' },
  { key: 'contact.messageLabel', category: 'contact', 'en-US': 'Message', 'zh-CN': '留言' },
  { key: 'contact.messagePlaceholder', category: 'contact', 'en-US': 'Tell us how we can help...', 'zh-CN': '请告诉我们您需要什么帮助...' },
  { key: 'contact.submitButton', category: 'contact', 'en-US': 'Send Message', 'zh-CN': '发送消息' },
  { key: 'contact.infoTitle', category: 'contact', 'en-US': 'Get In Touch', 'zh-CN': '联系方式' },
  { key: 'contact.emailInfo', category: 'contact', 'en-US': 'Email', 'zh-CN': '邮箱' },
  { key: 'contact.phoneInfo', category: 'contact', 'en-US': 'Phone', 'zh-CN': '电话' },
  { key: 'contact.addressInfo', category: 'contact', 'en-US': 'Address', 'zh-CN': '地址' },

  // ─── News ───
  { key: 'news.noNews', category: 'news', 'en-US': 'No news articles yet.', 'zh-CN': '暂无新闻。' },
  { key: 'news.readMore', category: 'news', 'en-US': 'Read More', 'zh-CN': '阅读更多' },

  // ─── Footer ───
  { key: 'footer.quickLinks', category: 'footer', 'en-US': 'Quick Links', 'zh-CN': '快速链接' },
  { key: 'footer.contactUs', category: 'footer', 'en-US': 'Contact Us', 'zh-CN': '联系我们' },
  { key: 'footer.followUs', category: 'footer', 'en-US': 'Follow Us', 'zh-CN': '关注我们' },

  // ─── 404 Error ───
  { key: 'error.404.title', category: 'error', 'en-US': 'Page Not Found', 'zh-CN': '页面未找到' },
  { key: 'error.404.description', category: 'error', 'en-US': 'The page you are looking for doesn\'t exist or has been moved.', 'zh-CN': '您访问的页面不存在或已被移动。' },
  { key: 'error.backHome', category: 'error', 'en-US': 'Back to Home', 'zh-CN': '返回首页' },
  { key: 'error.browseProducts', category: 'error', 'en-US': 'Browse Products', 'zh-CN': '浏览产品' },
];

/* ================================================================
 * Helper: 将 UiTranslationSeed 展开为插入行
 * ================================================================*/

function expandUiTranslations(seeds: UiTranslationSeed[]) {
  const rows: { key: string; category: string; locale: string; value: string }[] = [];
  for (const s of seeds) {
    rows.push({ key: s.key, category: s.category, locale: 'en-US', value: s['en-US'] });
    rows.push({ key: s.key, category: s.category, locale: 'zh-CN', value: s['zh-CN'] });
  }
  return rows;
}

/* ================================================================
 * Main seed function
 * ================================================================*/

async function seed() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Vela — B2B Website Seed Data           ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ─── 1. Languages ───
  console.log('1️⃣  Seeding languages...');
  for (const lang of seedLanguages) {
    await db.insert(languages).values(lang).onConflictDoNothing();
    console.log(`   ✓ ${lang.code} — ${lang.englishName}`);
  }

  // ─── 2. Admin user ───
  console.log('\n2️⃣  Seeding admin user...');
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
  console.log(`   ✓ ${defaultAdmin.email} (password: ${defaultAdmin.password})`);

  // ─── 3. UI Translations ───
  console.log('\n3️⃣  Seeding UI translations...');
  const uiRows = expandUiTranslations(uiTranslationSeeds);
  let uiCount = 0;
  for (const item of uiRows) {
    await db.insert(uiTranslations).values(item).onConflictDoNothing();
    uiCount++;
  }
  console.log(`   ✓ ${uiCount} translation entries (${uiTranslationSeeds.length} keys × 2 locales)`);

  // ─── 4. Site Settings ───
  console.log('\n4️⃣  Seeding site settings...');
  const [settingsRow] = await db
    .insert(siteSettings)
    .values({
      contactEmail: 'info@example.com',
      contactPhone: '+1 (555) 123-4567',
      whatsapp: '+15551234567',
      establishedYear: 2010,
      businessHours: 'Mon-Fri 9:00 AM - 6:00 PM (UTC+8)',
      timezone: 'Asia/Shanghai',
    })
    .onConflictDoNothing()
    .returning({ id: siteSettings.id });

  if (settingsRow) {
    // Site settings translations
    await db
      .insert(siteSettingTranslations)
      .values([
        {
          locale: 'en-US',
          siteName: 'Vela Demo',
          siteDescription: 'Professional B2B industrial equipment supplier — providing high-quality solutions for global customers.',
          companyName: 'Vela Industrial Co., Ltd.',
          slogan: 'Quality First, Innovation Driven',
          address: '123 Innovation Road, Industrial District, Shanghai, China',
          footerText: 'Your trusted partner for industrial solutions since 2010.',
          copyright: '© {year} Vela Industrial Co., Ltd. All rights reserved.',
          contactCta: 'Get a Free Quote',
          seoKeywords: 'industrial equipment, B2B supplier, manufacturing solutions, OEM, wholesale',
        },
        {
          locale: 'zh-CN',
          siteName: 'Vela 演示站',
          siteDescription: '专业的 B2B 工业设备供应商 —— 为全球客户提供高品质的解决方案。',
          companyName: 'Vela 工业有限公司',
          slogan: '品质为先，创新驱动',
          address: '中国上海市工业园区创新路 123 号',
          footerText: '自 2010 年以来，您值得信赖的工业解决方案合作伙伴。',
          copyright: '© {year} Vela 工业有限公司 版权所有',
          contactCta: '获取免费报价',
          seoKeywords: '工业设备, B2B供应商, 制造解决方案, OEM, 批发',
        },
      ])
      .onConflictDoNothing();
    console.log('   ✓ Site settings + translations (en-US, zh-CN)');
  } else {
    console.log('   ⏭ Site settings already exist, skipped');
  }

  // ─── 5. Product Categories ───
  console.log('\n5️⃣  Seeding product categories...');
  const categoryData = [
    { slug: 'industrial-equipment', sortOrder: 0, enName: 'Industrial Equipment', enDesc: 'Heavy-duty industrial machinery and equipment for manufacturing and production.', zhName: '工业设备', zhDesc: '用于制造和生产的重型工业机械与设备。' },
    { slug: 'electronic-components', sortOrder: 1, enName: 'Electronic Components', enDesc: 'High-quality electronic parts and components for various applications.', zhName: '电子元器件', zhDesc: '适用于各种应用的高品质电子零部件。' },
    { slug: 'raw-materials', sortOrder: 2, enName: 'Raw Materials', enDesc: 'Premium raw materials for industrial use and manufacturing.', zhName: '原材料', zhDesc: '用于工业用途和制造的优质原材料。' },
    { slug: 'packaging-solutions', sortOrder: 3, enName: 'Packaging Solutions', enDesc: 'Comprehensive packaging solutions for businesses of all sizes.', zhName: '包装方案', zhDesc: '面向各规模企业的综合包装解决方案。' },
  ];

  for (const cat of categoryData) {
    const [row] = await db
      .insert(categories)
      .values({ slug: cat.slug, isActive: true, sortOrder: cat.sortOrder })
      .onConflictDoNothing()
      .returning({ id: categories.id });

    if (row) {
      await db.insert(categoryTranslations).values([
        { categoryId: row.id, locale: 'en-US', name: cat.enName, description: cat.enDesc },
        { categoryId: row.id, locale: 'zh-CN', name: cat.zhName, description: cat.zhDesc },
      ]).onConflictDoNothing();
      console.log(`   ✓ ${cat.slug} — ${cat.enName}`);
    } else {
      console.log(`   ⏭ ${cat.slug} already exists, skipped`);
    }
  }

  // ─── 6. Pages ───
  console.log('\n6️⃣  Seeding pages...');

  // --- Home Page ---
  let homePageId: string | undefined;
  const [homePageInsert] = await db
    .insert(pages)
    .values({ slug: 'home', status: 'published', isHomepage: true })
    .onConflictDoNothing()
    .returning({ id: pages.id });

  if (homePageInsert) {
    homePageId = homePageInsert.id;
  } else {
    // Page already exists — fetch its id
    const existing = await db.query.pages.findFirst({ where: eq(pages.slug, 'home') });
    homePageId = existing?.id;
  }

  // Check if it already has sections
  const homeHasSections = homePageId
    ? (await db.query.sections.findFirst({ where: eq(sections.pageId, homePageId) })) != null
    : false;

  if (homePageId && !homeHasSections) {
    const homePage = { id: homePageId };
    await db.insert(pageTranslations).values([
      { pageId: homePage.id, locale: 'en-US', title: 'Home', seoTitle: 'Vela Demo — Professional B2B Industrial Equipment Supplier', seoDescription: 'Discover high-quality industrial equipment and solutions. Get free quotes from our experienced team.' },
      { pageId: homePage.id, locale: 'zh-CN', title: '首页', seoTitle: 'Vela 演示站 — 专业 B2B 工业设备供应商', seoDescription: '发现高品质工业设备与解决方案。从我们经验丰富的团队获取免费报价。' },
    ]).onConflictDoNothing();

    // ── Home: Hero Section ──
    const [heroSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'hero', sortOrder: 0, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      {
        sectionId: heroSec.id, locale: 'en-US',
        title: 'Your Trusted Industrial Solutions Partner',
        subtitle: 'We provide high-quality equipment and materials to businesses worldwide with competitive pricing and reliable delivery.',
        buttonText: 'Explore Products', buttonLink: '/products',
        secondaryButtonText: 'Contact Us', secondaryButtonLink: '/contact',
      },
      {
        sectionId: heroSec.id, locale: 'zh-CN',
        title: '您值得信赖的工业解决方案合作伙伴',
        subtitle: '我们以极具竞争力的价格和可靠的交付，为全球企业提供高品质设备和材料。',
        buttonText: '浏览产品', buttonLink: '/products',
        secondaryButtonText: '联系我们', secondaryButtonLink: '/contact',
      },
    ]);

    // ── Home: Feature Grid Section ──
    const [featureSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'feature_grid', sortOrder: 1, isActive: true,
      config: { columns: 4 },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      { sectionId: featureSec.id, locale: 'en-US', title: 'Why Choose Us', subtitle: 'We combine years of experience with cutting-edge technology to deliver exceptional value.' },
      { sectionId: featureSec.id, locale: 'zh-CN', title: '为什么选择我们', subtitle: '我们将多年经验与前沿技术相结合，为您创造卓越价值。' },
    ]);

    const featureItems = [
      { icon: 'Shield', enTitle: 'Quality Assured', enDesc: 'All products undergo strict quality control with ISO certification standards.', zhTitle: '品质保证', zhDesc: '所有产品均经过严格的质量控制，符合 ISO 认证标准。', sort: 0 },
      { icon: 'Globe', enTitle: 'Global Shipping', enDesc: 'Fast and reliable shipping to over 100 countries worldwide.', zhTitle: '全球配送', zhDesc: '快速可靠的配送服务，覆盖全球 100 多个国家。', sort: 1 },
      { icon: 'Headphones', enTitle: '24/7 Support', enDesc: 'Professional customer service team available around the clock.', zhTitle: '全天候服务', zhDesc: '专业客服团队全天候为您提供支持。', sort: 2 },
      { icon: 'Settings', enTitle: 'OEM & Customization', enDesc: 'Tailored solutions with custom specifications to meet your exact needs.', zhTitle: 'OEM 定制', zhDesc: '根据您的精确需求，提供定制规格的解决方案。', sort: 3 },
    ];

    for (const f of featureItems) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: featureSec.id, iconName: f.icon, sortOrder: f.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values([
        { itemId: item.id, locale: 'en-US', title: f.enTitle, description: f.enDesc },
        { itemId: item.id, locale: 'zh-CN', title: f.zhTitle, description: f.zhDesc },
      ]);
    }

    // ── Home: Product Showcase Section ──
    const [productShowcase] = await db.insert(sections).values({
      pageId: homePage.id, type: 'product_showcase', sortOrder: 2, isActive: true,
      config: { columns: 4, limit: 8 },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      { sectionId: productShowcase.id, locale: 'en-US', title: 'Featured Products', subtitle: 'Explore our best-selling and most popular products.', buttonText: 'View All Products', buttonLink: '/products' },
      { sectionId: productShowcase.id, locale: 'zh-CN', title: '精选产品', subtitle: '探索我们最畅销和最受欢迎的产品。', buttonText: '查看全部产品', buttonLink: '/products' },
    ]);

    // ── Home: Stats Section ──
    const [statsSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'stats', sortOrder: 3, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      { sectionId: statsSec.id, locale: 'en-US', title: 'Trusted by Businesses Worldwide' },
      { sectionId: statsSec.id, locale: 'zh-CN', title: '深受全球企业信赖' },
    ]);

    const statsItems = [
      { enTitle: 'Years of Experience', enDesc: '15', enContent: '+', zhTitle: '年行业经验', zhDesc: '15', zhContent: '+', sort: 0 },
      { enTitle: 'Countries Served', enDesc: '100', enContent: '+', zhTitle: '个服务国家', zhDesc: '100', zhContent: '+', sort: 1 },
      { enTitle: 'Products Available', enDesc: '5000', enContent: '+', zhTitle: '种可用产品', zhDesc: '5000', zhContent: '+', sort: 2 },
      { enTitle: 'Satisfied Clients', enDesc: '2000', enContent: '+', zhTitle: '位满意客户', zhDesc: '2000', zhContent: '+', sort: 3 },
    ];

    for (const s of statsItems) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: statsSec.id, sortOrder: s.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values([
        { itemId: item.id, locale: 'en-US', title: s.enTitle, description: s.enDesc, content: s.enContent },
        { itemId: item.id, locale: 'zh-CN', title: s.zhTitle, description: s.zhDesc, content: s.zhContent },
      ]);
    }

    // ── Home: Category Nav Section ──
    const [catNavSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'category_nav', sortOrder: 4, isActive: true,
      config: { columns: 4, style: 'card' },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      { sectionId: catNavSec.id, locale: 'en-US', title: 'Browse by Category', subtitle: 'Find the right products organized by category.' },
      { sectionId: catNavSec.id, locale: 'zh-CN', title: '按分类浏览', subtitle: '按分类查找合适的产品。' },
    ]);

    // ── Home: CTA Section ──
    const [ctaSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'cta', sortOrder: 5, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      {
        sectionId: ctaSec.id, locale: 'en-US',
        title: 'Ready to Get Started?',
        subtitle: 'Contact our team today for a free consultation and competitive quote.',
        buttonText: 'Request a Quote', buttonLink: '/contact',
        secondaryButtonText: 'Download Catalog', secondaryButtonLink: '#',
      },
      {
        sectionId: ctaSec.id, locale: 'zh-CN',
        title: '准备好开始了吗？',
        subtitle: '立即联系我们的团队，获取免费咨询和有竞争力的报价。',
        buttonText: '获取报价', buttonLink: '/contact',
        secondaryButtonText: '下载产品目录', secondaryButtonLink: '#',
      },
    ]);

    console.log('   ✓ Home page + 6 sections (hero, features, products, stats, categories, cta)');
  } else if (homePageId && homeHasSections) {
    console.log('   ⏭ Home page already has sections, skipped');
  } else {
    console.log('   ⚠ Home page could not be created');
  }

  // --- About Page ---
  let aboutPageId: string | undefined;
  const [aboutPageInsert] = await db
    .insert(pages)
    .values({ slug: 'about', status: 'published', isHomepage: false })
    .onConflictDoNothing()
    .returning({ id: pages.id });

  if (aboutPageInsert) {
    aboutPageId = aboutPageInsert.id;
  } else {
    const existing = await db.query.pages.findFirst({ where: eq(pages.slug, 'about') });
    aboutPageId = existing?.id;
  }

  const aboutHasSections = aboutPageId
    ? (await db.query.sections.findFirst({ where: eq(sections.pageId, aboutPageId) })) != null
    : false;

  if (aboutPageId && !aboutHasSections) {
    const aboutPage = { id: aboutPageId };
    await db.insert(pageTranslations).values([
      { pageId: aboutPage.id, locale: 'en-US', title: 'About Us', seoTitle: 'About Us — Vela Industrial Co., Ltd.', seoDescription: 'Learn about our company history, mission, and the team behind our success.' },
      { pageId: aboutPage.id, locale: 'zh-CN', title: '关于我们', seoTitle: '关于我们 — Vela 工业有限公司', seoDescription: '了解我们的公司历史、使命和成功背后的团队。' },
    ]).onConflictDoNothing();

    // ── About: Hero Section ──
    const [aboutHero] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'hero', sortOrder: 0, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      {
        sectionId: aboutHero.id, locale: 'en-US',
        title: 'About Vela Industrial',
        subtitle: 'Since 2010, we have been dedicated to providing top-quality industrial solutions to businesses across the globe.',
      },
      {
        sectionId: aboutHero.id, locale: 'zh-CN',
        title: '关于 Vela 工业',
        subtitle: '自 2010 年以来，我们一直致力于为全球企业提供顶级工业解决方案。',
      },
    ]);

    // ── About: Two Column — Company Story ──
    const [storySec] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'two_column', sortOrder: 1, isActive: true,
      config: { reversed: false },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      {
        sectionId: storySec.id, locale: 'en-US',
        title: 'Our Story',
        content: '<p>Founded in 2010, Vela Industrial started as a small trading company with a vision to bridge the gap between manufacturers and global buyers.</p><p>Over the years, we have grown into a comprehensive B2B platform offering thousands of products across multiple categories. Our commitment to quality, innovation, and customer satisfaction has earned us the trust of over 2,000 clients worldwide.</p><p>Today, we continue to expand our product range and services to meet the evolving needs of modern businesses.</p>',
        buttonText: 'Contact Us', buttonLink: '/contact',
      },
      {
        sectionId: storySec.id, locale: 'zh-CN',
        title: '我们的故事',
        content: '<p>Vela 工业成立于 2010 年，最初是一家小型贸易公司，愿景是架起制造商与全球买家之间的桥梁。</p><p>多年来，我们已发展成为一个综合性 B2B 平台，提供覆盖多个品类的数千种产品。我们对品质、创新和客户满意的承诺，赢得了全球 2,000 多位客户的信赖。</p><p>如今，我们持续扩展产品线和服务范围，以满足现代企业不断变化的需求。</p>',
        buttonText: '联系我们', buttonLink: '/contact',
      },
    ]);

    // ── About: Timeline — Milestones ──
    const [timelineSec] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'timeline', sortOrder: 2, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      { sectionId: timelineSec.id, locale: 'en-US', title: 'Our Journey', subtitle: 'Key milestones in our company\'s growth.' },
      { sectionId: timelineSec.id, locale: 'zh-CN', title: '发展历程', subtitle: '公司成长过程中的关键里程碑。' },
    ]);

    const milestones = [
      { enTitle: '2010 — Founded', enDesc: 'Established in Shanghai with a focus on industrial equipment trading.', zhTitle: '2010 — 公司成立', zhDesc: '在上海成立，专注于工业设备贸易。', sort: 0 },
      { enTitle: '2013 — First Export', enDesc: 'Completed our first international export to Southeast Asian markets.', zhTitle: '2013 — 首次出口', zhDesc: '完成首次向东南亚市场的国际出口。', sort: 1 },
      { enTitle: '2016 — ISO Certified', enDesc: 'Achieved ISO 9001 quality management system certification.', zhTitle: '2016 — ISO 认证', zhDesc: '获得 ISO 9001 质量管理体系认证。', sort: 2 },
      { enTitle: '2019 — 1,000 Clients', enDesc: 'Reached 1,000 active clients milestone across 50 countries.', zhTitle: '2019 — 千位客户', zhDesc: '在 50 个国家达成 1,000 位活跃客户的里程碑。', sort: 3 },
      { enTitle: '2023 — Digital Upgrade', enDesc: 'Launched our new B2B e-commerce platform for a seamless online experience.', zhTitle: '2023 — 数字化升级', zhDesc: '推出全新 B2B 电商平台，提供无缝在线体验。', sort: 4 },
    ];

    for (const m of milestones) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: timelineSec.id, sortOrder: m.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values([
        { itemId: item.id, locale: 'en-US', title: m.enTitle, description: m.enDesc },
        { itemId: item.id, locale: 'zh-CN', title: m.zhTitle, description: m.zhDesc },
      ]);
    }

    // ── About: Feature Grid — Values ──
    const [valuesSec] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'feature_grid', sortOrder: 3, isActive: true,
      config: { columns: 3 },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      { sectionId: valuesSec.id, locale: 'en-US', title: 'Our Core Values', subtitle: 'The principles that guide everything we do.' },
      { sectionId: valuesSec.id, locale: 'zh-CN', title: '核心价值观', subtitle: '指导我们一切行动的原则。' },
    ]);

    const values = [
      { icon: 'Award', enTitle: 'Excellence', enDesc: 'We strive for the highest standards in every product and service we deliver.', zhTitle: '卓越', zhDesc: '我们在提供的每一个产品和服务中追求最高标准。', sort: 0 },
      { icon: 'Users', enTitle: 'Integrity', enDesc: 'Honesty and transparency are the foundation of all our business relationships.', zhTitle: '诚信', zhDesc: '诚实和透明是我们所有商业关系的基石。', sort: 1 },
      { icon: 'Lightbulb', enTitle: 'Innovation', enDesc: 'We continuously adopt new technologies and methods to serve you better.', zhTitle: '创新', zhDesc: '我们不断采用新技术和新方法，为您提供更好的服务。', sort: 2 },
    ];

    for (const v of values) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: valuesSec.id, iconName: v.icon, sortOrder: v.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values([
        { itemId: item.id, locale: 'en-US', title: v.enTitle, description: v.enDesc },
        { itemId: item.id, locale: 'zh-CN', title: v.zhTitle, description: v.zhDesc },
      ]);
    }

    // ── About: CTA Section ──
    const [aboutCta] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'cta', sortOrder: 4, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values([
      {
        sectionId: aboutCta.id, locale: 'en-US',
        title: 'Partner With Us',
        subtitle: 'Looking for a reliable supplier? Let\'s discuss how we can work together.',
        buttonText: 'Get in Touch', buttonLink: '/contact',
      },
      {
        sectionId: aboutCta.id, locale: 'zh-CN',
        title: '与我们合作',
        subtitle: '正在寻找可靠的供应商？让我们一起探讨合作方式。',
        buttonText: '联系我们', buttonLink: '/contact',
      },
    ]);

    console.log('   ✓ About page + 5 sections (hero, story, timeline, values, cta)');
  } else if (aboutPageId && aboutHasSections) {
    console.log('   ⏭ About page already has sections, skipped');
  } else {
    console.log('   ⚠ About page could not be created');
  }

  // ─── 7. Navigation Menu ───
  console.log('\n7️⃣  Seeding navigation...');

  const navData = [
    { type: 'internal' as const, url: '/', sort: 0, enLabel: 'Home', zhLabel: '首页' },
    { type: 'internal' as const, url: '/products', sort: 1, enLabel: 'Products', zhLabel: '产品' },
    { type: 'page' as const, url: null, sort: 2, enLabel: 'About Us', zhLabel: '关于我们', pageSlug: 'about' },
    { type: 'internal' as const, url: '/news', sort: 3, enLabel: 'News', zhLabel: '新闻' },
    { type: 'internal' as const, url: '/contact', sort: 4, enLabel: 'Contact', zhLabel: '联系我们' },
  ];

  // Fetch about page id for navigation link
  const aboutPageForNav = aboutPageId
    ? { id: aboutPageId }
    : await db.query.pages.findFirst({ where: eq(pages.slug, 'about') });

  for (const nav of navData) {
    const values: Record<string, unknown> = {
      type: nav.type,
      url: nav.url,
      sortOrder: nav.sort,
      isActive: true,
    };

    if (nav.type === 'page' && nav.pageSlug === 'about' && aboutPageForNav) {
      values.pageId = aboutPageForNav.id;
    }

    const [navItem] = await db
      .insert(navigationItems)
      .values(values as typeof navigationItems.$inferInsert)
      .returning({ id: navigationItems.id });

    if (navItem) {
      await db.insert(navigationItemTranslations).values([
        { itemId: navItem.id, locale: 'en-US', label: nav.enLabel },
        { itemId: navItem.id, locale: 'zh-CN', label: nav.zhLabel },
      ]).onConflictDoNothing();
      console.log(`   ✓ ${nav.enLabel}`);
    }
  }

  // ─── Done ───
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ✅ Seed completed successfully!         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n📋 Summary:');
  console.log('   • 5 languages (en-US, zh-CN, es-ES, ar-SA, ja-JP)');
  console.log('   • 1 admin user');
  console.log(`   • ${uiTranslationSeeds.length} UI translation keys × 2 locales`);
  console.log('   • Site settings + company info (en-US, zh-CN)');
  console.log('   • 4 product categories');
  console.log('   • Home page (6 sections) + About page (5 sections)');
  console.log('   • 5 navigation items');
  console.log('\n🔑 Admin login:');
  console.log(`   Email:    ${defaultAdmin.email}`);
  console.log(`   Password: ${defaultAdmin.password}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Log in to the admin panel at /admin/login');
  console.log('   2. Upload a logo in Settings');
  console.log('   3. Add products to your categories');
  console.log('   4. Customize the page sections as needed');
  console.log('   5. Configure SMTP for inquiry notifications');

  await conn.end();
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

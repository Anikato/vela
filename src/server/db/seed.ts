/**
 * 数据库种子脚本 — 完整的 B2B 网站预设数据
 * 运行：pnpm db:seed
 *
 * 包含：
 *  1. 语言配置（仅 en-US，用户可在后台自行添加其他语言）
 *  2. 管理员账号
 *  3. 全部 UI 翻译键（en-US）
 *  4. 站点设置 + 公司信息（en-US）
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
  value: string;
}

const uiTranslationSeeds: UiTranslationSeed[] = [
  // ─── Cookie ───
  { key: 'cookie.title', category: 'cookie', value: 'Cookie Preferences' },
  { key: 'cookie.description', category: 'cookie', value: 'We use cookies to improve your browsing experience. You can accept or reject non-essential cookies.' },
  { key: 'cookie.accept', category: 'cookie', value: 'Accept' },
  { key: 'cookie.reject', category: 'cookie', value: 'Reject' },

  // ─── Common ───
  { key: 'common.close', category: 'common', value: 'Close' },
  { key: 'common.cancel', category: 'common', value: 'Cancel' },
  { key: 'common.submit', category: 'common', value: 'Submit' },
  { key: 'common.loading', category: 'common', value: 'Loading...' },
  { key: 'common.previous', category: 'common', value: 'Previous' },
  { key: 'common.next', category: 'common', value: 'Next' },

  // ─── Navigation ───
  { key: 'nav.home', category: 'nav', value: 'Home' },
  { key: 'nav.products', category: 'nav', value: 'Products' },
  { key: 'nav.about', category: 'nav', value: 'About Us' },
  { key: 'nav.news', category: 'nav', value: 'News' },
  { key: 'nav.contact', category: 'nav', value: 'Contact' },

  // ─── Search ───
  { key: 'search.placeholder', category: 'search', value: 'Search products...' },
  { key: 'search.button', category: 'search', value: 'Search' },
  { key: 'search.noResults', category: 'search', value: 'No products found matching your search.' },
  { key: 'search.resultCount', category: 'search', value: '{count} product(s) found' },

  // ─── Products ───
  { key: 'product.allProducts', category: 'product', value: 'All Products' },
  { key: 'product.sortNewest', category: 'product', value: 'Newest' },
  { key: 'product.sortPopular', category: 'product', value: 'Most Popular' },
  { key: 'product.sortNameAsc', category: 'product', value: 'Name A-Z' },
  { key: 'product.sortNameDesc', category: 'product', value: 'Name Z-A' },
  { key: 'product.noProducts', category: 'product', value: 'No products found in this category.' },
  { key: 'product.totalCount', category: 'product', value: '{count} product(s)' },
  { key: 'product.categories', category: 'product', value: 'Categories' },
  { key: 'product.addToInquiry', category: 'product', value: 'Add to Inquiry' },
  { key: 'product.sendInquiry', category: 'product', value: 'Send Inquiry' },
  { key: 'product.relatedProducts', category: 'product', value: 'Related Products' },
  { key: 'product.specifications', category: 'product', value: 'Specifications' },
  { key: 'product.videos', category: 'product', value: 'Videos' },
  { key: 'product.attachments', category: 'product', value: 'Downloads' },
  { key: 'product.moq', category: 'product', value: 'MOQ' },
  { key: 'product.leadTime', category: 'product', value: 'Lead Time' },
  { key: 'product.tradeTerms', category: 'product', value: 'Trade Terms' },
  { key: 'product.paymentTerms', category: 'product', value: 'Payment Terms' },
  { key: 'product.packaging', category: 'product', value: 'Packaging' },
  { key: 'product.customization', category: 'product', value: 'Customization' },
  { key: 'product.customizationYes', category: 'product', value: 'Available' },
  { key: 'product.customizationNo', category: 'product', value: 'Not Available' },
  { key: 'product.days', category: 'product', value: 'days' },
  { key: 'product.viewDetails', category: 'product', value: 'View Details' },

  // ─── Inquiry ───
  { key: 'inquiry.basketTitle', category: 'inquiry', value: 'Inquiry Basket' },
  { key: 'inquiry.basketEmpty', category: 'inquiry', value: 'Your inquiry basket is empty.' },
  { key: 'inquiry.submitInquiry', category: 'inquiry', value: 'Submit Inquiry' },
  { key: 'inquiry.clearAll', category: 'inquiry', value: 'Clear All' },
  { key: 'inquiry.formTitle', category: 'inquiry', value: 'Send Inquiry' },
  { key: 'inquiry.name', category: 'inquiry', value: 'Your Name' },
  { key: 'inquiry.email', category: 'inquiry', value: 'Email Address' },
  { key: 'inquiry.phone', category: 'inquiry', value: 'Phone Number' },
  { key: 'inquiry.company', category: 'inquiry', value: 'Company Name' },
  { key: 'inquiry.country', category: 'inquiry', value: 'Country / Region' },
  { key: 'inquiry.message', category: 'inquiry', value: 'Your Message' },
  { key: 'inquiry.submit', category: 'inquiry', value: 'Send' },
  { key: 'inquiry.success', category: 'inquiry', value: 'Your inquiry has been sent successfully! We will get back to you within 24 hours.' },
  { key: 'inquiry.error', category: 'inquiry', value: 'Failed to send inquiry. Please try again later.' },

  // ─── Contact ───
  { key: 'contact.title', category: 'contact', value: 'Contact Us' },
  { key: 'contact.subtitle', category: 'contact', value: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible." },
  { key: 'contact.nameLabel', category: 'contact', value: 'Full Name' },
  { key: 'contact.namePlaceholder', category: 'contact', value: 'Enter your full name' },
  { key: 'contact.emailLabel', category: 'contact', value: 'Email' },
  { key: 'contact.emailPlaceholder', category: 'contact', value: 'Enter your email address' },
  { key: 'contact.messageLabel', category: 'contact', value: 'Message' },
  { key: 'contact.messagePlaceholder', category: 'contact', value: 'Tell us how we can help...' },
  { key: 'contact.submitButton', category: 'contact', value: 'Send Message' },
  { key: 'contact.infoTitle', category: 'contact', value: 'Get In Touch' },
  { key: 'contact.emailInfo', category: 'contact', value: 'Email' },
  { key: 'contact.phoneInfo', category: 'contact', value: 'Phone' },
  { key: 'contact.addressInfo', category: 'contact', value: 'Address' },

  // ─── News ───
  { key: 'news.noNews', category: 'news', value: 'No news articles yet.' },
  { key: 'news.readMore', category: 'news', value: 'Read More' },

  // ─── Footer ───
  { key: 'footer.quickLinks', category: 'footer', value: 'Quick Links' },
  { key: 'footer.contactUs', category: 'footer', value: 'Contact Us' },
  { key: 'footer.followUs', category: 'footer', value: 'Follow Us' },

  // ─── 404 Error ───
  { key: 'error.404.title', category: 'error', value: 'Page Not Found' },
  { key: 'error.404.description', category: 'error', value: "The page you are looking for doesn't exist or has been moved." },
  { key: 'error.backHome', category: 'error', value: 'Back to Home' },
  { key: 'error.browseProducts', category: 'error', value: 'Browse Products' },
];

/* ================================================================
 * Helper: 将 UiTranslationSeed 展开为插入行
 * ================================================================*/

function expandUiTranslations(seeds: UiTranslationSeed[]) {
  return seeds.map((s) => ({
    key: s.key,
    category: s.category,
    locale: 'en-US',
    value: s.value,
  }));
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
  console.log(`   ✓ ${uiCount} translation entries (${uiTranslationSeeds.length} keys × en-US)`);

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
    await db
      .insert(siteSettingTranslations)
      .values({
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
      })
      .onConflictDoNothing();
    console.log('   ✓ Site settings + translations (en-US)');
  } else {
    console.log('   ⏭ Site settings already exist, skipped');
  }

  // ─── 5. Product Categories ───
  console.log('\n5️⃣  Seeding product categories...');
  const categoryData = [
    { slug: 'industrial-equipment', sortOrder: 0, name: 'Industrial Equipment', desc: 'Heavy-duty industrial machinery and equipment for manufacturing and production.' },
    { slug: 'electronic-components', sortOrder: 1, name: 'Electronic Components', desc: 'High-quality electronic parts and components for various applications.' },
    { slug: 'raw-materials', sortOrder: 2, name: 'Raw Materials', desc: 'Premium raw materials for industrial use and manufacturing.' },
    { slug: 'packaging-solutions', sortOrder: 3, name: 'Packaging Solutions', desc: 'Comprehensive packaging solutions for businesses of all sizes.' },
  ];

  for (const cat of categoryData) {
    const [row] = await db
      .insert(categories)
      .values({ slug: cat.slug, isActive: true, sortOrder: cat.sortOrder })
      .onConflictDoNothing()
      .returning({ id: categories.id });

    if (row) {
      await db.insert(categoryTranslations).values({
        categoryId: row.id, locale: 'en-US', name: cat.name, description: cat.desc,
      }).onConflictDoNothing();
      console.log(`   ✓ ${cat.slug} — ${cat.name}`);
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
    const existing = await db.query.pages.findFirst({ where: eq(pages.slug, 'home') });
    homePageId = existing?.id;
  }

  const homeHasSections = homePageId
    ? (await db.query.sections.findFirst({ where: eq(sections.pageId, homePageId) })) != null
    : false;

  if (homePageId && !homeHasSections) {
    const homePage = { id: homePageId };
    await db.insert(pageTranslations).values({
      pageId: homePage.id, locale: 'en-US', title: 'Home',
      seoTitle: 'Vela Demo — Professional B2B Industrial Equipment Supplier',
      seoDescription: 'Discover high-quality industrial equipment and solutions. Get free quotes from our experienced team.',
    }).onConflictDoNothing();

    // ── Home: Hero Section ──
    const [heroSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'hero', sortOrder: 0, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: heroSec.id, locale: 'en-US',
      title: 'Your Trusted Industrial Solutions Partner',
      subtitle: 'We provide high-quality equipment and materials to businesses worldwide with competitive pricing and reliable delivery.',
      buttonText: 'Explore Products', buttonLink: '/products',
      secondaryButtonText: 'Contact Us', secondaryButtonLink: '/contact',
    });

    // ── Home: Feature Grid Section ──
    const [featureSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'feature_grid', sortOrder: 1, isActive: true,
      config: { columns: 4 },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: featureSec.id, locale: 'en-US',
      title: 'Why Choose Us',
      subtitle: 'We combine years of experience with cutting-edge technology to deliver exceptional value.',
    });

    const featureItems = [
      { icon: 'Shield', title: 'Quality Assured', desc: 'All products undergo strict quality control with ISO certification standards.', sort: 0 },
      { icon: 'Globe', title: 'Global Shipping', desc: 'Fast and reliable shipping to over 100 countries worldwide.', sort: 1 },
      { icon: 'Headphones', title: '24/7 Support', desc: 'Professional customer service team available around the clock.', sort: 2 },
      { icon: 'Settings', title: 'OEM & Customization', desc: 'Tailored solutions with custom specifications to meet your exact needs.', sort: 3 },
    ];

    for (const f of featureItems) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: featureSec.id, iconName: f.icon, sortOrder: f.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values({
        itemId: item.id, locale: 'en-US', title: f.title, description: f.desc,
      });
    }

    // ── Home: Product Showcase Section ──
    const [productShowcase] = await db.insert(sections).values({
      pageId: homePage.id, type: 'product_showcase', sortOrder: 2, isActive: true,
      config: { columns: 4, limit: 8 },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: productShowcase.id, locale: 'en-US',
      title: 'Featured Products', subtitle: 'Explore our best-selling and most popular products.',
      buttonText: 'View All Products', buttonLink: '/products',
    });

    // ── Home: Stats Section ──
    const [statsSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'stats', sortOrder: 3, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: statsSec.id, locale: 'en-US', title: 'Trusted by Businesses Worldwide',
    });

    const statsItems = [
      { title: 'Years of Experience', desc: '15', content: '+', sort: 0 },
      { title: 'Countries Served', desc: '100', content: '+', sort: 1 },
      { title: 'Products Available', desc: '5000', content: '+', sort: 2 },
      { title: 'Satisfied Clients', desc: '2000', content: '+', sort: 3 },
    ];

    for (const s of statsItems) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: statsSec.id, sortOrder: s.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values({
        itemId: item.id, locale: 'en-US', title: s.title, description: s.desc, content: s.content,
      });
    }

    // ── Home: Category Nav Section ──
    const [catNavSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'category_nav', sortOrder: 4, isActive: true,
      config: { columns: 4, style: 'card' },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: catNavSec.id, locale: 'en-US',
      title: 'Browse by Category', subtitle: 'Find the right products organized by category.',
    });

    // ── Home: CTA Section ──
    const [ctaSec] = await db.insert(sections).values({
      pageId: homePage.id, type: 'cta', sortOrder: 5, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: ctaSec.id, locale: 'en-US',
      title: 'Ready to Get Started?',
      subtitle: 'Contact our team today for a free consultation and competitive quote.',
      buttonText: 'Request a Quote', buttonLink: '/contact',
      secondaryButtonText: 'Download Catalog', secondaryButtonLink: '#',
    });

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
    await db.insert(pageTranslations).values({
      pageId: aboutPage.id, locale: 'en-US', title: 'About Us',
      seoTitle: 'About Us — Vela Industrial Co., Ltd.',
      seoDescription: 'Learn about our company history, mission, and the team behind our success.',
    }).onConflictDoNothing();

    // ── About: Hero Section ──
    const [aboutHero] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'hero', sortOrder: 0, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: aboutHero.id, locale: 'en-US',
      title: 'About Vela Industrial',
      subtitle: 'Since 2010, we have been dedicated to providing top-quality industrial solutions to businesses across the globe.',
    });

    // ── About: Two Column — Company Story ──
    const [storySec] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'two_column', sortOrder: 1, isActive: true,
      config: { reversed: false },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: storySec.id, locale: 'en-US',
      title: 'Our Story',
      content: '<p>Founded in 2010, Vela Industrial started as a small trading company with a vision to bridge the gap between manufacturers and global buyers.</p><p>Over the years, we have grown into a comprehensive B2B platform offering thousands of products across multiple categories. Our commitment to quality, innovation, and customer satisfaction has earned us the trust of over 2,000 clients worldwide.</p><p>Today, we continue to expand our product range and services to meet the evolving needs of modern businesses.</p>',
      buttonText: 'Contact Us', buttonLink: '/contact',
    });

    // ── About: Timeline — Milestones ──
    const [timelineSec] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'timeline', sortOrder: 2, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: timelineSec.id, locale: 'en-US',
      title: 'Our Journey', subtitle: "Key milestones in our company's growth.",
    });

    const milestones = [
      { title: '2010 — Founded', desc: 'Established in Shanghai with a focus on industrial equipment trading.', sort: 0 },
      { title: '2013 — First Export', desc: 'Completed our first international export to Southeast Asian markets.', sort: 1 },
      { title: '2016 — ISO Certified', desc: 'Achieved ISO 9001 quality management system certification.', sort: 2 },
      { title: '2019 — 1,000 Clients', desc: 'Reached 1,000 active clients milestone across 50 countries.', sort: 3 },
      { title: '2023 — Digital Upgrade', desc: 'Launched our new B2B e-commerce platform for a seamless online experience.', sort: 4 },
    ];

    for (const m of milestones) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: timelineSec.id, sortOrder: m.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values({
        itemId: item.id, locale: 'en-US', title: m.title, description: m.desc,
      });
    }

    // ── About: Feature Grid — Values ──
    const [valuesSec] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'feature_grid', sortOrder: 3, isActive: true,
      config: { columns: 3 },
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: valuesSec.id, locale: 'en-US',
      title: 'Our Core Values', subtitle: 'The principles that guide everything we do.',
    });

    const coreValues = [
      { icon: 'Award', title: 'Excellence', desc: 'We strive for the highest standards in every product and service we deliver.', sort: 0 },
      { icon: 'Users', title: 'Integrity', desc: 'Honesty and transparency are the foundation of all our business relationships.', sort: 1 },
      { icon: 'Lightbulb', title: 'Innovation', desc: 'We continuously adopt new technologies and methods to serve you better.', sort: 2 },
    ];

    for (const v of coreValues) {
      const [item] = await db.insert(sectionItems).values({
        sectionId: valuesSec.id, iconName: v.icon, sortOrder: v.sort,
      }).returning({ id: sectionItems.id });

      await db.insert(sectionItemTranslations).values({
        itemId: item.id, locale: 'en-US', title: v.title, description: v.desc,
      });
    }

    // ── About: CTA Section ──
    const [aboutCta] = await db.insert(sections).values({
      pageId: aboutPage.id, type: 'cta', sortOrder: 4, isActive: true,
    }).returning({ id: sections.id });

    await db.insert(sectionTranslations).values({
      sectionId: aboutCta.id, locale: 'en-US',
      title: 'Partner With Us',
      subtitle: "Looking for a reliable supplier? Let's discuss how we can work together.",
      buttonText: 'Get in Touch', buttonLink: '/contact',
    });

    console.log('   ✓ About page + 5 sections (hero, story, timeline, values, cta)');
  } else if (aboutPageId && aboutHasSections) {
    console.log('   ⏭ About page already has sections, skipped');
  } else {
    console.log('   ⚠ About page could not be created');
  }

  // ─── 7. Navigation Menu ───
  console.log('\n7️⃣  Seeding navigation...');

  const navData = [
    { type: 'internal' as const, url: '/', sort: 0, label: 'Home' },
    { type: 'internal' as const, url: '/products', sort: 1, label: 'Products' },
    { type: 'page' as const, url: null, sort: 2, label: 'About Us', pageSlug: 'about' },
    { type: 'internal' as const, url: '/news', sort: 3, label: 'News' },
    { type: 'internal' as const, url: '/contact', sort: 4, label: 'Contact' },
  ];

  const aboutPageForNav = aboutPageId
    ? { id: aboutPageId }
    : await db.query.pages.findFirst({ where: eq(pages.slug, 'about') });

  const existingNavItems = await db.select({
    id: navigationItems.id,
    sortOrder: navigationItems.sortOrder,
  }).from(navigationItems);

  const existingSortOrders = new Set(existingNavItems.map((n) => n.sortOrder));

  for (const nav of navData) {
    if (existingSortOrders.has(nav.sort)) {
      console.log(`   ⏭ ${nav.label} (sort=${nav.sort}) already exists, skipped`);
      continue;
    }

    const navValues: Record<string, unknown> = {
      type: nav.type,
      url: nav.url,
      sortOrder: nav.sort,
      isActive: true,
    };

    if (nav.type === 'page' && 'pageSlug' in nav && nav.pageSlug === 'about' && aboutPageForNav) {
      navValues.pageId = aboutPageForNav.id;
    }

    const [navItem] = await db
      .insert(navigationItems)
      .values(navValues as typeof navigationItems.$inferInsert)
      .returning({ id: navigationItems.id });

    if (navItem) {
      await db.insert(navigationItemTranslations).values({
        itemId: navItem.id, locale: 'en-US', label: nav.label,
      }).onConflictDoNothing();
      console.log(`   ✓ ${nav.label}`);
    }
  }

  // ─── Done ───
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ✅ Seed completed successfully!         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n📋 Summary:');
  console.log('   • 1 language (en-US) — add more languages in admin panel');
  console.log('   • 1 admin user');
  console.log(`   • ${uiTranslationSeeds.length} UI translation keys (en-US)`);
  console.log('   • Site settings + company info (en-US)');
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
  console.log('   4. Add more languages if needed (Admin > Languages)');
  console.log('   5. Customize the page sections as needed');
  console.log('   6. Configure SMTP for inquiry notifications');

  await conn.end();
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

/**
 * Lightweight seed script for Docker first-boot.
 * Uses only `postgres` and `bcryptjs` (both copied into the image).
 * Idempotent: checks if data exists before inserting.
 */
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vela.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'admin';

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set, skipping seed');
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });

  try {
    const existing = await sql`SELECT count(*)::int AS cnt FROM languages`;
    if (existing[0].cnt > 0) {
      console.log('  Database already seeded, skipping');
      return;
    }

    console.log('  First boot detected, seeding initial data...');

    // 1. Language
    await sql`
      INSERT INTO languages (code, english_name, native_name, chinese_name, azure_code, google_code, is_rtl, is_default, is_active, sort_order)
      VALUES ('en-US', 'English', 'English', '英语（美国）', 'en', 'en', false, true, true, 0)
      ON CONFLICT DO NOTHING
    `;
    console.log('  ✓ Language: en-US');

    // 2. Admin user
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${ADMIN_EMAIL}, ${passwordHash}, ${ADMIN_NAME}, 'admin')
      ON CONFLICT DO NOTHING
    `;
    console.log(`  ✓ Admin: ${ADMIN_EMAIL}`);

    // 3. Site settings
    const settingsResult = await sql`
      INSERT INTO site_settings (contact_email, contact_phone, whatsapp, established_year, business_hours, timezone)
      VALUES ('info@example.com', '+1 (555) 123-4567', '+15551234567', 2010, 'Mon-Fri 9:00 AM - 6:00 PM (UTC+8)', 'Asia/Shanghai')
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (settingsResult.length > 0) {
      await sql`
        INSERT INTO site_setting_translations (locale, site_name, site_description, company_name, slogan, address, footer_text, copyright, contact_cta, seo_keywords)
        VALUES ('en-US', 'Vela Demo', 'Professional B2B industrial equipment supplier — providing high-quality solutions for global customers.', 'Vela Industrial Co., Ltd.', 'Quality First, Innovation Driven', '123 Innovation Road, Industrial District, Shanghai, China', 'Your trusted partner for industrial solutions since 2010.', '© {year} Vela Industrial Co., Ltd. All rights reserved.', 'Get a Free Quote', 'industrial equipment, B2B supplier, manufacturing solutions, OEM, wholesale')
        ON CONFLICT DO NOTHING
      `;
    }
    console.log('  ✓ Site settings');

    // 4. UI translations
    const uiKeys = [
      ['cookie.title', 'cookie', 'Cookie Preferences'],
      ['cookie.description', 'cookie', 'We use cookies to improve your browsing experience. You can accept or reject non-essential cookies.'],
      ['cookie.accept', 'cookie', 'Accept'],
      ['cookie.reject', 'cookie', 'Reject'],
      ['common.close', 'common', 'Close'],
      ['common.cancel', 'common', 'Cancel'],
      ['common.submit', 'common', 'Submit'],
      ['common.loading', 'common', 'Loading...'],
      ['common.previous', 'common', 'Previous'],
      ['common.next', 'common', 'Next'],
      ['nav.home', 'nav', 'Home'],
      ['nav.products', 'nav', 'Products'],
      ['nav.about', 'nav', 'About Us'],
      ['nav.news', 'nav', 'News'],
      ['nav.contact', 'nav', 'Contact'],
      ['search.placeholder', 'search', 'Search products...'],
      ['search.button', 'search', 'Search'],
      ['search.noResults', 'search', 'No products found matching your search.'],
      ['search.resultCount', 'search', '{count} product(s) found'],
      ['product.allProducts', 'product', 'All Products'],
      ['product.sortNewest', 'product', 'Newest'],
      ['product.sortPopular', 'product', 'Most Popular'],
      ['product.sortNameAsc', 'product', 'Name A-Z'],
      ['product.sortNameDesc', 'product', 'Name Z-A'],
      ['product.noProducts', 'product', 'No products found in this category.'],
      ['product.totalCount', 'product', '{count} product(s)'],
      ['product.categories', 'product', 'Categories'],
      ['product.addToInquiry', 'product', 'Add to Inquiry'],
      ['product.sendInquiry', 'product', 'Send Inquiry'],
      ['product.relatedProducts', 'product', 'Related Products'],
      ['product.specifications', 'product', 'Specifications'],
      ['product.videos', 'product', 'Videos'],
      ['product.attachments', 'product', 'Downloads'],
      ['product.moq', 'product', 'MOQ'],
      ['product.leadTime', 'product', 'Lead Time'],
      ['product.tradeTerms', 'product', 'Trade Terms'],
      ['product.paymentTerms', 'product', 'Payment Terms'],
      ['product.packaging', 'product', 'Packaging'],
      ['product.customization', 'product', 'Customization'],
      ['product.customizationYes', 'product', 'Available'],
      ['product.customizationNo', 'product', 'Not Available'],
      ['product.days', 'product', 'days'],
      ['product.viewDetails', 'product', 'View Details'],
      ['inquiry.basketTitle', 'inquiry', 'Inquiry Basket'],
      ['inquiry.basketEmpty', 'inquiry', 'Your inquiry basket is empty.'],
      ['inquiry.submitInquiry', 'inquiry', 'Submit Inquiry'],
      ['inquiry.clearAll', 'inquiry', 'Clear All'],
      ['inquiry.formTitle', 'inquiry', 'Send Inquiry'],
      ['inquiry.name', 'inquiry', 'Your Name'],
      ['inquiry.email', 'inquiry', 'Email Address'],
      ['inquiry.phone', 'inquiry', 'Phone Number'],
      ['inquiry.company', 'inquiry', 'Company Name'],
      ['inquiry.country', 'inquiry', 'Country / Region'],
      ['inquiry.message', 'inquiry', 'Your Message'],
      ['inquiry.submit', 'inquiry', 'Send'],
      ['inquiry.success', 'inquiry', 'Your inquiry has been sent successfully! We will get back to you within 24 hours.'],
      ['inquiry.error', 'inquiry', 'Failed to send inquiry. Please try again later.'],
      ['contact.title', 'contact', 'Contact Us'],
      ['contact.subtitle', 'contact', "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."],
      ['contact.nameLabel', 'contact', 'Full Name'],
      ['contact.namePlaceholder', 'contact', 'Enter your full name'],
      ['contact.emailLabel', 'contact', 'Email'],
      ['contact.emailPlaceholder', 'contact', 'Enter your email address'],
      ['contact.messageLabel', 'contact', 'Message'],
      ['contact.messagePlaceholder', 'contact', 'Tell us how we can help...'],
      ['contact.submitButton', 'contact', 'Send Message'],
      ['contact.infoTitle', 'contact', 'Get In Touch'],
      ['contact.emailInfo', 'contact', 'Email'],
      ['contact.phoneInfo', 'contact', 'Phone'],
      ['contact.addressInfo', 'contact', 'Address'],
      ['news.noNews', 'news', 'No news articles yet.'],
      ['news.readMore', 'news', 'Read More'],
      ['footer.quickLinks', 'footer', 'Quick Links'],
      ['footer.contactUs', 'footer', 'Contact Us'],
      ['footer.followUs', 'footer', 'Follow Us'],
      ['error.404.title', 'error', 'Page Not Found'],
      ['error.404.description', 'error', "The page you are looking for doesn't exist or has been moved."],
      ['error.backHome', 'error', 'Back to Home'],
      ['error.browseProducts', 'error', 'Browse Products'],
    ];

    for (const [key, category, value] of uiKeys) {
      await sql`
        INSERT INTO ui_translations (key, category, locale, value)
        VALUES (${key}, ${category}, 'en-US', ${value})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`  ✓ ${uiKeys.length} UI translation keys`);

    // 5. Product categories
    const categoryData = [
      ['industrial-equipment', 0, 'Industrial Equipment', 'Heavy-duty industrial machinery and equipment for manufacturing and production.'],
      ['electronic-components', 1, 'Electronic Components', 'High-quality electronic parts and components for various applications.'],
      ['raw-materials', 2, 'Raw Materials', 'Premium raw materials for industrial use and manufacturing.'],
      ['packaging-solutions', 3, 'Packaging Solutions', 'Comprehensive packaging solutions for businesses of all sizes.'],
    ];

    for (const [slug, sortOrder, name, desc] of categoryData) {
      const catResult = await sql`
        INSERT INTO categories (slug, is_active, sort_order)
        VALUES (${slug}, true, ${sortOrder})
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (catResult.length > 0) {
        await sql`
          INSERT INTO category_translations (category_id, locale, name, description)
          VALUES (${catResult[0].id}, 'en-US', ${name}, ${desc})
          ON CONFLICT DO NOTHING
        `;
      }
    }
    console.log('  ✓ 4 product categories');

    // 6. Home page
    const homeResult = await sql`
      INSERT INTO pages (slug, status, is_homepage)
      VALUES ('home', 'published', true)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (homeResult.length > 0) {
      const hid = homeResult[0].id;
      await sql`INSERT INTO page_translations (page_id, locale, title, seo_title, seo_description) VALUES (${hid}, 'en-US', 'Home', 'Vela Demo — Professional B2B Industrial Equipment Supplier', 'Discover high-quality industrial equipment and solutions. Get free quotes from our experienced team.') ON CONFLICT DO NOTHING`;

      // Hero
      const [hero] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active) VALUES (${hid}, 'hero', 0, true) RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle, button_text, button_link, secondary_button_text, secondary_button_link) VALUES (${hero.id}, 'en-US', 'Your Trusted Industrial Solutions Partner', 'We provide high-quality equipment and materials to businesses worldwide with competitive pricing and reliable delivery.', 'Explore Products', '/products', 'Contact Us', '/contact')`;

      // Feature grid
      const [feat] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active, config) VALUES (${hid}, 'feature_grid', 1, true, '{"columns":4}') RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle) VALUES (${feat.id}, 'en-US', 'Why Choose Us', 'We combine years of experience with cutting-edge technology to deliver exceptional value.')`;
      const features = [
        ['Shield', 'Quality Assured', 'All products undergo strict quality control with ISO certification standards.', 0],
        ['Globe', 'Global Shipping', 'Fast and reliable shipping to over 100 countries worldwide.', 1],
        ['Headphones', '24/7 Support', 'Professional customer service team available around the clock.', 2],
        ['Settings', 'OEM & Customization', 'Tailored solutions with custom specifications to meet your exact needs.', 3],
      ];
      for (const [icon, title, desc, sort] of features) {
        const [item] = await sql`INSERT INTO section_items (section_id, icon_name, sort_order) VALUES (${feat.id}, ${icon}, ${sort}) RETURNING id`;
        await sql`INSERT INTO section_item_translations (item_id, locale, title, description) VALUES (${item.id}, 'en-US', ${title}, ${desc})`;
      }

      // Product showcase
      const [ps] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active, config) VALUES (${hid}, 'product_showcase', 2, true, '{"columns":4,"limit":8}') RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle, button_text, button_link) VALUES (${ps.id}, 'en-US', 'Featured Products', 'Explore our best-selling and most popular products.', 'View All Products', '/products')`;

      // Stats
      const [stats] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active) VALUES (${hid}, 'stats', 3, true) RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title) VALUES (${stats.id}, 'en-US', 'Trusted by Businesses Worldwide')`;
      const statsData = [
        ['Years of Experience', '15', '+', 0],
        ['Countries Served', '100', '+', 1],
        ['Products Available', '5000', '+', 2],
        ['Satisfied Clients', '2000', '+', 3],
      ];
      for (const [title, desc, content, sort] of statsData) {
        const [item] = await sql`INSERT INTO section_items (section_id, sort_order) VALUES (${stats.id}, ${sort}) RETURNING id`;
        await sql`INSERT INTO section_item_translations (item_id, locale, title, description, content) VALUES (${item.id}, 'en-US', ${title}, ${desc}, ${content})`;
      }

      // Category nav
      const [cn] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active, config) VALUES (${hid}, 'category_nav', 4, true, '{"columns":4,"style":"card"}') RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle) VALUES (${cn.id}, 'en-US', 'Browse by Category', 'Find the right products organized by category.')`;

      // CTA
      const [cta] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active) VALUES (${hid}, 'cta', 5, true) RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle, button_text, button_link, secondary_button_text, secondary_button_link) VALUES (${cta.id}, 'en-US', 'Ready to Get Started?', 'Contact our team today for a free consultation and competitive quote.', 'Request a Quote', '/contact', 'Download Catalog', '#')`;

      console.log('  ✓ Home page + 6 sections');
    }

    // 7. About page
    const aboutResult = await sql`
      INSERT INTO pages (slug, status, is_homepage)
      VALUES ('about', 'published', false)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (aboutResult.length > 0) {
      const aid = aboutResult[0].id;
      await sql`INSERT INTO page_translations (page_id, locale, title, seo_title, seo_description) VALUES (${aid}, 'en-US', 'About Us', 'About Us — Vela Industrial Co., Ltd.', 'Learn about our company history, mission, and the team behind our success.') ON CONFLICT DO NOTHING`;

      const [ah] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active) VALUES (${aid}, 'hero', 0, true) RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle) VALUES (${ah.id}, 'en-US', 'About Vela Industrial', 'Since 2010, we have been dedicated to providing top-quality industrial solutions to businesses across the globe.')`;

      const [story] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active, config) VALUES (${aid}, 'two_column', 1, true, '{"reversed":false}') RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, content, button_text, button_link) VALUES (${story.id}, 'en-US', 'Our Story', '<p>Founded in 2010, Vela Industrial started as a small trading company with a vision to bridge the gap between manufacturers and global buyers.</p><p>Over the years, we have grown into a comprehensive B2B platform offering thousands of products across multiple categories.</p>', 'Contact Us', '/contact')`;

      const [tl] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active) VALUES (${aid}, 'timeline', 2, true) RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle) VALUES (${tl.id}, 'en-US', 'Our Journey', ${"Key milestones in our company's growth."})`;
      const milestones = [
        ['2010 — Founded', 'Established in Shanghai with a focus on industrial equipment trading.', 0],
        ['2013 — First Export', 'Completed our first international export to Southeast Asian markets.', 1],
        ['2016 — ISO Certified', 'Achieved ISO 9001 quality management system certification.', 2],
        ['2019 — 1,000 Clients', 'Reached 1,000 active clients milestone across 50 countries.', 3],
        ['2023 — Digital Upgrade', 'Launched our new B2B e-commerce platform for a seamless online experience.', 4],
      ];
      for (const [title, desc, sort] of milestones) {
        const [item] = await sql`INSERT INTO section_items (section_id, sort_order) VALUES (${tl.id}, ${sort}) RETURNING id`;
        await sql`INSERT INTO section_item_translations (item_id, locale, title, description) VALUES (${item.id}, 'en-US', ${title}, ${desc})`;
      }

      const [vals] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active, config) VALUES (${aid}, 'feature_grid', 3, true, '{"columns":3}') RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle) VALUES (${vals.id}, 'en-US', 'Our Core Values', 'The principles that guide everything we do.')`;
      const coreValues = [
        ['Award', 'Excellence', 'We strive for the highest standards in every product and service we deliver.', 0],
        ['Users', 'Integrity', 'Honesty and transparency are the foundation of all our business relationships.', 1],
        ['Lightbulb', 'Innovation', 'We continuously adopt new technologies and methods to serve you better.', 2],
      ];
      for (const [icon, title, desc, sort] of coreValues) {
        const [item] = await sql`INSERT INTO section_items (section_id, icon_name, sort_order) VALUES (${vals.id}, ${icon}, ${sort}) RETURNING id`;
        await sql`INSERT INTO section_item_translations (item_id, locale, title, description) VALUES (${item.id}, 'en-US', ${title}, ${desc})`;
      }

      const [acta] = await sql`INSERT INTO sections (page_id, type, sort_order, is_active) VALUES (${aid}, 'cta', 4, true) RETURNING id`;
      await sql`INSERT INTO section_translations (section_id, locale, title, subtitle, button_text, button_link) VALUES (${acta.id}, 'en-US', 'Partner With Us', ${"Looking for a reliable supplier? Let's discuss how we can work together."}, 'Get in Touch', '/contact')`;

      console.log('  ✓ About page + 5 sections');
    }

    // 8. Navigation
    const existingNav = await sql`SELECT count(*)::int AS cnt FROM navigation_items`;
    if (existingNav[0].cnt === 0) {
      const aboutPage = await sql`SELECT id FROM pages WHERE slug = 'about' LIMIT 1`;
      const aboutId = aboutPage.length > 0 ? aboutPage[0].id : null;

      const navData = [
        ['internal', '/', 0, 'Home', null],
        ['internal', '/products', 1, 'Products', null],
        ['page', null, 2, 'About Us', aboutId],
        ['internal', '/news', 3, 'News', null],
        ['internal', '/contact', 4, 'Contact', null],
      ];

      for (const [type, url, sort, label, pageId] of navData) {
        const [navItem] = await sql`
          INSERT INTO navigation_items (type, url, sort_order, is_active, page_id)
          VALUES (${type}, ${url}, ${sort}, true, ${pageId})
          RETURNING id
        `;
        await sql`
          INSERT INTO navigation_item_translations (item_id, locale, label)
          VALUES (${navItem.id}, 'en-US', ${label})
          ON CONFLICT DO NOTHING
        `;
      }
      console.log('  ✓ 5 navigation items');
    }

    console.log('\n  Seed completed!');
    console.log(`  Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } finally {
    await sql.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

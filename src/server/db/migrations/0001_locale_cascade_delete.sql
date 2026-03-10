ALTER TABLE "category_translations" DROP CONSTRAINT "category_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "tag_translations" DROP CONSTRAINT "tag_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "product_attribute_group_translations" DROP CONSTRAINT "product_attribute_group_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "product_attribute_translations" DROP CONSTRAINT "product_attribute_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "product_translations" DROP CONSTRAINT "product_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "page_translations" DROP CONSTRAINT "page_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "section_item_translations" DROP CONSTRAINT "section_item_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "section_translations" DROP CONSTRAINT "section_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "navigation_item_translations" DROP CONSTRAINT "navigation_item_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "inquiry_form_field_translations" DROP CONSTRAINT "inquiry_form_field_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "news_translations" DROP CONSTRAINT "news_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "ui_translations" DROP CONSTRAINT "ui_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "site_setting_translations" DROP CONSTRAINT "site_setting_translations_locale_languages_code_fk";
--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_attribute_group_translations" ADD CONSTRAINT "product_attribute_group_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_attribute_translations" ADD CONSTRAINT "product_attribute_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "page_translations" ADD CONSTRAINT "page_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "section_item_translations" ADD CONSTRAINT "section_item_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "section_translations" ADD CONSTRAINT "section_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "navigation_item_translations" ADD CONSTRAINT "navigation_item_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inquiry_form_field_translations" ADD CONSTRAINT "inquiry_form_field_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "news_translations" ADD CONSTRAINT "news_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ui_translations" ADD CONSTRAINT "ui_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "site_setting_translations" ADD CONSTRAINT "site_setting_translations_locale_languages_code_fk" FOREIGN KEY ("locale") REFERENCES "public"."languages"("code") ON DELETE cascade ON UPDATE no action;

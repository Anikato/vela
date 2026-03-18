ALTER TABLE "tags" ADD COLUMN "badge_style" varchar(20) DEFAULT 'none' NOT NULL;
ALTER TABLE "tags" ADD COLUMN "badge_color" varchar(20) DEFAULT 'red' NOT NULL;
ALTER TABLE "tags" ADD COLUMN "badge_position" varchar(20) DEFAULT 'top-left' NOT NULL;

import { sql, relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin, editor
  preferences: jsonb("preferences"), // user preferences for personalization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  slug: varchar("slug").unique().notNull(),
  description: text("description"),
  icon: varchar("icon"),
  parentId: varchar("parent_id"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_categories_slug").on(table.slug),
  index("idx_categories_parent").on(table.parentId),
  index("idx_categories_active").on(table.isActive),
]);

// Merchants table
export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  slug: varchar("slug").unique().notNull(),
  description: text("description"),
  website: varchar("website"),
  logoUrl: varchar("logo_url"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }),
  affiliateNetworkId: varchar("affiliate_network_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_merchants_slug").on(table.slug),
  index("idx_merchants_active").on(table.isActive),
]);

// Affiliate Networks table
export const affiliateNetworks = pgTable("affiliate_networks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  slug: varchar("slug").unique().notNull(),
  apiEndpoint: varchar("api_endpoint"),
  apiKey: varchar("api_key"),
  programId: varchar("program_id"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }),
  status: varchar("status").default("active"), // active, inactive, pending
  lastSyncAt: timestamp("last_sync_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  description: text("description"),
  merchantId: varchar("merchant_id").references(() => merchants.id).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  discountPercentage: integer("discount_percentage"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").default(0),
  isActive: boolean("is_active").default(true),
  imageUrl: varchar("image_url"),
  productUrl: varchar("product_url"),
  affiliateUrl: varchar("affiliate_url"),
  sku: varchar("sku"),
  metadata: jsonb("metadata"), // Additional product data
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_merchant").on(table.merchantId),
  index("idx_products_active").on(table.isActive),
  index("idx_products_price").on(table.salePrice),
  index("idx_products_rating").on(table.rating),
]);

// Product categories junction table
export const productCategories = pgTable("product_categories", {
  productId: varchar("product_id").references(() => products.id).notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
}, (table) => [
  unique().on(table.productId, table.categoryId),
  index("idx_product_categories_product").on(table.productId),
  index("idx_product_categories_category").on(table.categoryId),
]);

// Coupons table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  code: varchar("code").unique().notNull(),
  discountType: varchar("discount_type").notNull(), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumSpend: decimal("minimum_spend", { precision: 10, scale: 2 }),
  merchantId: varchar("merchant_id").references(() => merchants.id).notNull(),
  productId: varchar("product_id").references(() => products.id),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  startDate: timestamp("start_date"),
  expiresAt: timestamp("expires_at"),
  usageCount: integer("usage_count").default(0),
  maxUsage: integer("max_usage"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_coupons_merchant").on(table.merchantId),
  index("idx_coupons_code").on(table.code),
  index("idx_coupons_expires").on(table.expiresAt),
]);

// Email subscribers
export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  status: varchar("status").default("active"), // active, unsubscribed, bounced
  preferences: jsonb("preferences"), // email preferences and categories
  lastEmailSent: timestamp("last_email_sent"),
  unsubscribeToken: varchar("unsubscribe_token"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_subscribers_email").on(table.email),
  index("idx_subscribers_status").on(table.status),
]);

// Email campaigns
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  templateType: varchar("template_type").notNull(), // daily_deals, welcome, category_specific
  content: jsonb("content"), // email content and template data
  targetCategories: varchar("target_categories").array(),
  status: varchar("status").default("draft"), // draft, scheduled, sent, cancelled
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales funnels
export const salesFunnels = pgTable("sales_funnels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // email_capture, category_specific, abandoned_cart
  description: text("description"),
  config: jsonb("config"), // funnel configuration and steps
  isActive: boolean("is_active").default(true),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  totalVisitors: integer("total_visitors").default(0),
  totalConversions: integer("total_conversions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clickouts table for analytics and conversion tracking
export const clickouts = pgTable("clickouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  merchantId: varchar("merchant_id").references(() => merchants.id),
  couponId: varchar("coupon_id").references(() => coupons.id),
  sessionId: varchar("session_id"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  referrer: varchar("referrer"),
  sourceUrl: varchar("source_url"),
  targetUrl: varchar("target_url").notNull(),
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  conversionStatus: varchar("conversion_status").default("pending"), // pending, confirmed, rejected
  occurredAt: timestamp("occurred_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_clickouts_occurred").on(table.occurredAt),
  index("idx_clickouts_user").on(table.userId),
  index("idx_clickouts_product").on(table.productId),
]);

// Analytics metrics table for aggregated data
export const analyticsMetrics = pgTable("analytics_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  period: varchar("period").notNull(), // daily, weekly, monthly
  totalPageViews: integer("total_page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  totalClickouts: integer("total_clickouts").default(0),
  totalConversions: integer("total_conversions").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissions: decimal("total_commissions", { precision: 12, scale: 2 }).default("0.00"),
  topProducts: jsonb("top_products"),
  topMerchants: jsonb("top_merchants"),
  topCategories: jsonb("top_categories"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI generation logs
export const aiGenerationLogs = pgTable("ai_generation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // product_discovery, categorization, content_generation
  source: varchar("source"), // google_trends, amazon_api, affiliate_feeds
  productsFound: integer("products_found").default(0),
  productsAdded: integer("products_added").default(0),
  productsUpdated: integer("products_updated").default(0),
  errors: jsonb("errors"),
  metadata: jsonb("metadata"),
  status: varchar("status").default("running"), // running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  productCategories: many(productCategories),
}));

export const merchantsRelations = relations(merchants, ({ many }) => ({
  products: many(products),
  coupons: many(coupons),
  clickouts: many(clickouts),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [products.merchantId],
    references: [merchants.id],
  }),
  categories: many(productCategories),
  coupons: many(coupons),
  clickouts: many(clickouts),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  product: one(products, {
    fields: [coupons.productId],
    references: [products.id],
  }),
  merchant: one(merchants, {
    fields: [coupons.merchantId],
    references: [merchants.id],
  }),
  clickouts: many(clickouts),
}));

export const clickoutsRelations = relations(clickouts, ({ one }) => ({
  user: one(users, {
    fields: [clickouts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [clickouts.productId],
    references: [products.id],
  }),
  merchant: one(merchants, {
    fields: [clickouts.merchantId],
    references: [merchants.id],
  }),
  coupon: one(coupons, {
    fields: [clickouts.couponId],
    references: [coupons.id],
  }),
}));

export const subscribersRelations = relations(subscribers, ({ one }) => ({
  user: one(users, {
    fields: [subscribers.userId],
    references: [users.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export type InsertMerchant = typeof merchants.$inferInsert;
export type Merchant = typeof merchants.$inferSelect;

export type InsertAffiliateNetwork = typeof affiliateNetworks.$inferInsert;
export type AffiliateNetwork = typeof affiliateNetworks.$inferSelect;

export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;

export type InsertCoupon = typeof coupons.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;

export type InsertSubscriber = typeof subscribers.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;

export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

export type InsertSalesFunnel = typeof salesFunnels.$inferInsert;
export type SalesFunnel = typeof salesFunnels.$inferSelect;

export type InsertClickout = typeof clickouts.$inferInsert;
export type Clickout = typeof clickouts.$inferSelect;

export type InsertAnalyticsMetrics = typeof analyticsMetrics.$inferInsert;
export type AnalyticsMetrics = typeof analyticsMetrics.$inferSelect;

export type InsertAIGenerationLog = typeof aiGenerationLogs.$inferInsert;
export type AIGenerationLog = typeof aiGenerationLogs.$inferSelect;

// Insert schemas for validation
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertMerchantSchema = createInsertSchema(merchants).omit({ id: true, createdAt: true });
export const insertAffiliateNetworkSchema = createInsertSchema(affiliateNetworks).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true, createdAt: true });
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({ id: true, createdAt: true });
export const insertSalesFunnelSchema = createInsertSchema(salesFunnels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClickoutSchema = createInsertSchema(clickouts).omit({ id: true, createdAt: true, occurredAt: true });

// Insert types for validation
export type InsertCategoryType = z.infer<typeof insertCategorySchema>;
export type InsertMerchantType = z.infer<typeof insertMerchantSchema>;
export type InsertAffiliateNetworkType = z.infer<typeof insertAffiliateNetworkSchema>;
export type InsertProductType = z.infer<typeof insertProductSchema>;
export type InsertCouponType = z.infer<typeof insertCouponSchema>;
export type InsertSubscriberType = z.infer<typeof insertSubscriberSchema>;
export type InsertEmailCampaignType = z.infer<typeof insertEmailCampaignSchema>;
export type InsertSalesFunnelType = z.infer<typeof insertSalesFunnelSchema>;
export type InsertClickoutType = z.infer<typeof insertClickoutSchema>;

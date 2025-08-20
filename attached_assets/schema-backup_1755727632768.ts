import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("viewer"), // admin, editor, viewer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  name: varchar("name").notNull(),
  icon: varchar("icon"),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_categories_slug").on(table.slug),
  index("idx_categories_parent").on(table.parentId),
]);

// Merchants table
export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  domain: varchar("domain").notNull(),
  logoUrl: varchar("logo_url"),
  affiliateNetwork: varchar("affiliate_network"),
  programId: varchar("program_id"),
  hasAffiliate: boolean("has_affiliate").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_merchants_slug").on(table.slug),
  index("idx_merchants_domain").on(table.domain),
]);

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull(),
  skuOrAsin: varchar("sku_or_asin").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priceCents: integer("price_cents"),
  currency: varchar("currency").default("USD"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count"),
  imageMain: varchar("image_main"),
  ownedBySite: boolean("owned_by_site").default(false),
  isLocked: boolean("is_locked").default(false),
  evergreenLocked: boolean("evergreen_locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_merchant").on(table.merchantId),
  index("idx_products_sku").on(table.merchantId, table.skuOrAsin),
  index("idx_products_created").on(table.createdAt),
]);

// Product images table
export const productImages = pgTable("product_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  url: varchar("url").notNull(),
  alt: varchar("alt"),
}, (table) => [
  index("idx_product_images_product").on(table.productId),
]);

// Product categories junction table
export const productCategories = pgTable("product_categories", {
  productId: varchar("product_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  primary: boolean("primary").default(false),
}, (table) => [
  index("idx_product_categories").on(table.productId, table.categoryId),
]);

// Discount type enum
export const discountTypeEnum = pgEnum("discount_type", ["percent", "amount", "free_ship", "bogo"]);

// Coupons table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id"),
  merchantId: varchar("merchant_id").notNull(),
  code: varchar("code").notNull(),
  discountType: discountTypeEnum("discount_type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  minSpendCents: integer("min_spend_cents"),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  verified: boolean("verified").default(false),
  verificationMethod: varchar("verification_method"),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_coupons_merchant").on(table.merchantId),
  index("idx_coupons_product").on(table.productId),
  index("idx_coupons_code").on(table.code),
  index("idx_coupons_expires").on(table.expiresAt),
]);

// Advanced clickouts table for analytics and conversion tracking
export const clickouts = pgTable("clickouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  merchantId: varchar("merchant_id").references(() => merchants.id),
  couponId: varchar("coupon_id").references(() => coupons.id),
  
  // Tracking data
  clickType: varchar("click_type").notNull(), // 'product', 'coupon', 'merchant'
  sourceUrl: varchar("source_url"),
  targetUrl: varchar("target_url").notNull(),
  
  // User data
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
  referrer: varchar("referrer"),
  
  // UTM and campaign tracking
  utmSource: varchar("utm_source"),
  utmCampaign: varchar("utm_campaign"),
  subid: varchar("subid"),
  
  // Conversion tracking
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }),
  estimatedCommission: decimal("estimated_commission", { precision: 10, scale: 2 }),
  conversionStatus: varchar("conversion_status").default("pending"), // 'pending', 'confirmed', 'rejected'
  conversionDate: timestamp("conversion_date"),
  
  // Analytics metadata
  sessionId: varchar("session_id"),
  campaignId: varchar("campaign_id"),
  
  occurredAt: timestamp("occurred_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_clickouts_occurred").on(table.occurredAt),
  index("idx_clickouts_merchant").on(table.merchantId, table.occurredAt),
  index("idx_clickouts_user").on(table.userId, table.occurredAt),
  index("idx_clickouts_session").on(table.sessionId),
]);

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  status: varchar("status").default("active"), // active, unsubscribed, bounced
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_subscribers_email").on(table.email),
  index("idx_subscribers_status").on(table.status),
]);

// Feature flags
export const featureFlags = pgTable("feature_flags", {
  key: varchar("key").primaryKey(),
  enabled: boolean("enabled").default(false),
  config: jsonb("config"),
});

// User preferences for personalization
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  categoryIds: varchar("category_ids").array().default(sql`ARRAY[]::varchar[]`),
  merchantIds: varchar("merchant_ids").array().default(sql`ARRAY[]::varchar[]`),
  priceRangeMin: integer("price_range_min"),
  priceRangeMax: integer("price_range_max"),
  discountThreshold: integer("discount_threshold").default(10),
  notificationFrequency: varchar("notification_frequency").default("daily"), // daily, weekly, instant
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_preferences_user").on(table.userId),
]);

// User interactions for behavior tracking
export const userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  entityType: varchar("entity_type").notNull(), // product, merchant, category, coupon
  entityId: varchar("entity_id").notNull(),
  interactionType: varchar("interaction_type").notNull(), // view, click, save, share, purchase
  duration: integer("duration"), // seconds spent on entity
  source: varchar("source"), // search, recommendation, category_browse, etc
  occurredAt: timestamp("occurred_at").defaultNow(),
}, (table) => [
  index("idx_user_interactions_user").on(table.userId, table.occurredAt),
  index("idx_user_interactions_entity").on(table.entityType, table.entityId),
  index("idx_user_interactions_type").on(table.interactionType),
]);

// Generated recommendations for users
export const userRecommendations = pgTable("user_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  entityType: varchar("entity_type").notNull(), // product, coupon
  entityId: varchar("entity_id").notNull(),
  score: decimal("score", { precision: 5, scale: 4 }).notNull(), // 0-1 relevance score
  reasonType: varchar("reason_type").notNull(), // similar_categories, trending, price_drop, etc
  reasons: text("reasons").array().default(sql`ARRAY[]::text[]`),
  isViewed: boolean("is_viewed").default(false),
  isClicked: boolean("is_clicked").default(false),
  isExpired: boolean("is_expired").default(false),
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_user_recommendations_user").on(table.userId, table.generatedAt),
  index("idx_user_recommendations_score").on(table.score),
  unique("idx_user_recommendations_unique").on(table.userId, table.entityType, table.entityId),
]);

// Saved deals/favorites
export const userSavedDeals = pgTable("user_saved_deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  entityType: varchar("entity_type").notNull(), // product, coupon
  entityId: varchar("entity_id").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_saved_deals_user").on(table.userId, table.createdAt),
  unique("idx_user_saved_deals_unique").on(table.userId, table.entityType, table.entityId),
]);

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
  images: many(productImages),
  categories: many(productCategories),
  coupons: many(coupons),
  clickouts: many(clickouts),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
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

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userInteractions.userId],
    references: [users.id],
  }),
}));

export const userRecommendationsRelations = relations(userRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [userRecommendations.userId],
    references: [users.id],
  }),
}));

export const userSavedDealsRelations = relations(userSavedDeals, ({ one }) => ({
  user: one(users, {
    fields: [userSavedDeals.userId],
    references: [users.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  
  // Page data
  pageUrl: varchar("page_url").notNull(),
  pageTitle: varchar("page_title"),
  pageType: varchar("page_type"), // 'home', 'category', 'product', 'merchant'
  entityId: varchar("entity_id"), // ID of the entity being viewed
  
  // Session data
  sessionId: varchar("session_id").notNull(),
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
  referrer: varchar("referrer"),
  
  // Time tracking
  timeOnPage: integer("time_on_page"), // seconds
  bounceRate: boolean("bounce_rate").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversionEvents = pgTable("conversion_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clickoutId: varchar("clickout_id").references(() => clickouts.id).notNull(),
  
  // Conversion details
  eventType: varchar("event_type").notNull(), // 'purchase', 'signup', 'lead'
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  
  // Commission details
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  
  // Merchant data
  orderId: varchar("order_id"),
  merchantTransactionId: varchar("merchant_transaction_id"),
  
  // Verification
  verificationStatus: varchar("verification_status").default("pending"), // 'pending', 'verified', 'disputed'
  verificationDate: timestamp("verification_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyticsMetrics = pgTable("analytics_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Time period
  date: varchar("date").notNull(), // YYYY-MM-DD format
  period: varchar("period").notNull(), // 'daily', 'weekly', 'monthly'
  
  // Traffic metrics
  totalPageViews: integer("total_page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  totalSessions: integer("total_sessions").default(0),
  avgSessionDuration: integer("avg_session_duration").default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Conversion metrics
  totalClickouts: integer("total_clickouts").default(0),
  totalConversions: integer("total_conversions").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Revenue metrics
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissions: decimal("total_commissions", { precision: 12, scale: 2 }).default("0.00"),
  avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }).default("0.00"),
  
  // Top performing entities
  topProducts: jsonb("top_products"), // [{ id, name, clicks, conversions, revenue }]
  topMerchants: jsonb("top_merchants"),
  topCategories: jsonb("top_categories"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
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

export const pageViewsRelations = relations(pageViews, ({ one }) => ({
  user: one(users, {
    fields: [pageViews.userId],
    references: [users.id],
  }),
}));

export const conversionEventsRelations = relations(conversionEvents, ({ one }) => ({
  clickout: one(clickouts, {
    fields: [conversionEvents.clickoutId],
    references: [clickouts.id],
  }),
}));

// Insert schemas
export const insertClickoutSchema = createInsertSchema(clickouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  createdAt: true,
});

export const insertConversionEventSchema = createInsertSchema(conversionEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsMetricsSchema = createInsertSchema(analyticsMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Clickout = typeof clickouts.$inferSelect;
export type InsertClickout = z.infer<typeof insertClickoutSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type ConversionEvent = typeof conversionEvents.$inferSelect;
export type InsertConversionEvent = z.infer<typeof insertConversionEventSchema>;
export type AnalyticsMetrics = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetrics = z.infer<typeof insertAnalyticsMetricsSchema>;

export type InsertCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export type InsertMerchant = typeof merchants.$inferInsert;
export type Merchant = typeof merchants.$inferSelect;

export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;

export type InsertCoupon = typeof coupons.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;

export type InsertSubscriber = typeof subscribers.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;

export type InsertClickout = typeof clickouts.$inferInsert;
export type Clickout = typeof clickouts.$inferSelect;

export type InsertUserPreferences = typeof userPreferences.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertUserInteraction = typeof userInteractions.$inferInsert;
export type UserInteraction = typeof userInteractions.$inferSelect;

export type InsertUserRecommendation = typeof userRecommendations.$inferInsert;
export type UserRecommendation = typeof userRecommendations.$inferSelect;

export type InsertUserSavedDeal = typeof userSavedDeals.$inferInsert;
export type UserSavedDeal = typeof userSavedDeals.$inferSelect;

// Insert schemas for validation
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertMerchantSchema = createInsertSchema(merchants).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true });
export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true, createdAt: true });


export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({ id: true, occurredAt: true });
export const insertUserRecommendationSchema = createInsertSchema(userRecommendations).omit({ id: true, generatedAt: true });
export const insertUserSavedDealSchema = createInsertSchema(userSavedDeals).omit({ id: true, createdAt: true });

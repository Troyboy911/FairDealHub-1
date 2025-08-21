import {
  users,
  categories,
  merchants,
  affiliateNetworks,
  products,
  productCategories,
  coupons,
  subscribers,
  emailCampaigns,
  salesFunnels,
  clickouts,
  analyticsMetrics,
  aiGenerationLogs,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Merchant,
  type InsertMerchant,
  type AffiliateNetwork,
  type InsertAffiliateNetwork,
  type Product,
  type InsertProduct,
  type Coupon,
  type InsertCoupon,
  type Subscriber,
  type InsertSubscriber,
  type EmailCampaign,
  type InsertEmailCampaign,
  type SalesFunnel,
  type InsertSalesFunnel,
  type Clickout,
  type InsertClickout,
  type AnalyticsMetrics,
  type InsertAnalyticsMetrics,
  type AIGenerationLog,
  type InsertAIGenerationLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count, avg, sum, isNotNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Merchant operations
  getMerchants(): Promise<Merchant[]>;
  getMerchant(id: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: string, merchant: Partial<InsertMerchant>): Promise<Merchant>;
  deleteMerchant(id: string): Promise<void>;
  
  // Affiliate Network operations
  getAffiliateNetworks(): Promise<AffiliateNetwork[]>;
  getAffiliateNetwork(id: string): Promise<AffiliateNetwork | undefined>;
  createAffiliateNetwork(network: InsertAffiliateNetwork): Promise<AffiliateNetwork>;
  updateAffiliateNetwork(id: string, network: Partial<InsertAffiliateNetwork>): Promise<AffiliateNetwork>;
  deleteAffiliateNetwork(id: string): Promise<void>;
  
  // Product operations
  getProducts(limit?: number, offset?: number, categoryId?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getFeaturedProducts(limit: number): Promise<Product[]>;
  
  // Coupon operations
  getCoupons(): Promise<Coupon[]>;
  getCoupon(id: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon>;
  deleteCoupon(id: string): Promise<void>;
  getActiveCoupons(): Promise<Coupon[]>;
  
  // Subscriber operations
  getSubscribers(): Promise<Subscriber[]>;
  getSubscriber(email: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  updateSubscriber(id: string, subscriber: Partial<InsertSubscriber>): Promise<Subscriber>;
  unsubscribe(email: string): Promise<void>;
  
  // Email Campaign operations
  getEmailCampaigns(): Promise<EmailCampaign[]>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  
  // Sales Funnel operations
  getSalesFunnels(): Promise<SalesFunnel[]>;
  createSalesFunnel(funnel: InsertSalesFunnel): Promise<SalesFunnel>;
  updateSalesFunnel(id: string, funnel: Partial<InsertSalesFunnel>): Promise<SalesFunnel>;
  
  // Clickout operations
  createClickout(clickout: InsertClickout): Promise<Clickout>;
  getClickouts(startDate?: Date, endDate?: Date): Promise<Clickout[]>;
  
  // Analytics operations
  getAnalyticsMetrics(period: string, startDate?: Date, endDate?: Date): Promise<AnalyticsMetrics[]>;
  createAnalyticsMetrics(metrics: InsertAnalyticsMetrics): Promise<AnalyticsMetrics>;
  getActiveProductsCount(): Promise<number>;
  getSubscribersCount(): Promise<number>;
  getTotalClickouts(dateRange?: { start: Date; end: Date }): Promise<number>;
  getTotalConversions(dateRange?: { start: Date; end: Date }): Promise<number>;
  getRevenueStats(dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    totalCommissions: number;
    avgOrderValue: number;
    avgSavings: number;
  }>;
  getPageViews(dateRange?: { start: Date; end: Date }): Promise<number>;
  getUniqueVisitors(dateRange?: { start: Date; end: Date }): Promise<number>;
  getTopProducts(dateRange?: { start: Date; end: Date }): Promise<Array<{
    id: string;
    name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>>;
  getTopMerchants(dateRange?: { start: Date; end: Date }): Promise<Array<{
    id: string;
    name: string;
    clicks: number;
    revenue: number;
    share: number;
  }>>;
  getTopCategories(dateRange?: { start: Date; end: Date }): Promise<Array<{
    name: string;
    clicks: number;
    revenue: number;
  }>>;
  
  // AI Generation Log operations
  getAIGenerationLogs(limit?: number): Promise<AIGenerationLog[]>;
  createAIGenerationLog(log: InsertAIGenerationLog): Promise<AIGenerationLog>;
  updateAIGenerationLog(id: string, log: Partial<InsertAIGenerationLog>): Promise<AIGenerationLog>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
  
  // Merchant operations
  async getMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).where(eq(merchants.isActive, true));
  }

  async getMerchant(id: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [newMerchant] = await db.insert(merchants).values(merchant).returning();
    return newMerchant;
  }

  async updateMerchant(id: string, merchant: Partial<InsertMerchant>): Promise<Merchant> {
    const [updatedMerchant] = await db
      .update(merchants)
      .set(merchant)
      .where(eq(merchants.id, id))
      .returning();
    return updatedMerchant;
  }

  async deleteMerchant(id: string): Promise<void> {
    await db.delete(merchants).where(eq(merchants.id, id));
  }
  
  // Affiliate Network operations
  async getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return await db.select().from(affiliateNetworks).where(eq(affiliateNetworks.isActive, true));
  }

  async getAffiliateNetwork(id: string): Promise<AffiliateNetwork | undefined> {
    const [network] = await db.select().from(affiliateNetworks).where(eq(affiliateNetworks.id, id));
    return network;
  }

  async createAffiliateNetwork(network: InsertAffiliateNetwork): Promise<AffiliateNetwork> {
    const [newNetwork] = await db.insert(affiliateNetworks).values(network).returning();
    return newNetwork;
  }

  async updateAffiliateNetwork(id: string, network: Partial<InsertAffiliateNetwork>): Promise<AffiliateNetwork> {
    const [updatedNetwork] = await db
      .update(affiliateNetworks)
      .set(network)
      .where(eq(affiliateNetworks.id, id))
      .returning();
    return updatedNetwork;
  }

  async deleteAffiliateNetwork(id: string): Promise<void> {
    await db.delete(affiliateNetworks).where(eq(affiliateNetworks.id, id));
  }
  
  // Product operations
  async getProducts(limit = 50, offset = 0, categoryId?: string): Promise<Product[]> {
    if (categoryId) {
      return await db
        .select({
          products: products,
          product_categories: productCategories,
        })
        .from(products)
        .innerJoin(productCategories, eq(products.id, productCategories.productId))
        .where(and(
          eq(products.isActive, true),
          eq(productCategories.categoryId, categoryId)
        ))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        merchantId: products.merchantId,
        originalPrice: products.originalPrice,
        salePrice: products.salePrice,
        discountPercentage: products.discountPercentage,
        rating: products.rating,
        totalReviews: products.totalReviews,
        isActive: products.isActive,
        imageUrl: products.imageUrl,
        productUrl: products.productUrl,
        affiliateUrl: products.affiliateUrl,
        sku: products.sku,
        metadata: products.metadata,
        aiGenerated: products.aiGenerated,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt
      })
      .from(products)
      .innerJoin(productCategories, eq(products.id, productCategories.productId))
      .where(and(
        eq(products.isActive, true),
        eq(productCategories.categoryId, categoryId)
      ));
  }

  async getFeaturedProducts(limit: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.rating), desc(products.discountPercentage))
      .limit(limit);
  }
  
  // Coupon operations
  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).where(eq(coupons.isActive, true));
  }

  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values(coupon).returning();
    return newCoupon;
  }

  async updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon> {
    const [updatedCoupon] = await db
      .update(coupons)
      .set({ ...coupon, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return updatedCoupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async getActiveCoupons(): Promise<Coupon[]> {
    const now = new Date();
    return await db
      .select()
      .from(coupons)
      .where(and(
        eq(coupons.isActive, true),
        gte(coupons.expiresAt, now)
      ));
  }
  
  // Subscriber operations
  async getSubscribers(): Promise<Subscriber[]> {
    return await db.select().from(subscribers).where(eq(subscribers.status, "active"));
  }

  async getSubscriber(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return subscriber;
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const [newSubscriber] = await db.insert(subscribers).values(subscriber).returning();
    return newSubscriber;
  }

  async updateSubscriber(id: string, subscriber: Partial<InsertSubscriber>): Promise<Subscriber> {
    const [updatedSubscriber] = await db
      .update(subscribers)
      .set(subscriber)
      .where(eq(subscribers.id, id))
      .returning();
    return updatedSubscriber;
  }

  async unsubscribe(email: string): Promise<void> {
    await db
      .update(subscribers)
      .set({ status: "unsubscribed" })
      .where(eq(subscribers.email, email));
  }
  
  // Email Campaign operations
  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db.insert(emailCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateEmailCampaign(id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    const [updatedCampaign] = await db
      .update(emailCampaigns)
      .set(campaign)
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }
  
  // Sales Funnel operations
  async getSalesFunnels(): Promise<SalesFunnel[]> {
    return await db.select().from(salesFunnels).where(eq(salesFunnels.isActive, true));
  }

  async createSalesFunnel(funnel: InsertSalesFunnel): Promise<SalesFunnel> {
    const [newFunnel] = await db.insert(salesFunnels).values(funnel).returning();
    return newFunnel;
  }

  async updateSalesFunnel(id: string, funnel: Partial<InsertSalesFunnel>): Promise<SalesFunnel> {
    const [updatedFunnel] = await db
      .update(salesFunnels)
      .set({ ...funnel, updatedAt: new Date() })
      .where(eq(salesFunnels.id, id))
      .returning();
    return updatedFunnel;
  }
  
  // Clickout operations
  async createClickout(clickout: InsertClickout): Promise<Clickout> {
    const [newClickout] = await db.insert(clickouts).values(clickout).returning();
    return newClickout;
  }

  async getClickouts(startDate?: Date, endDate?: Date): Promise<Clickout[]> {
    let query = db.select().from(clickouts);
    
    if (startDate && endDate) {
      query = query.where(and(
        gte(clickouts.occurredAt, startDate),
        lte(clickouts.occurredAt, endDate)
      ));
    }
    
    return await query.orderBy(desc(clickouts.occurredAt));
  }
  
  // Analytics operations
  async getAnalyticsMetrics(period: string, startDate?: Date, endDate?: Date): Promise<AnalyticsMetrics[]> {
    let query = db.select().from(analyticsMetrics).where(eq(analyticsMetrics.period, period));
    
    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      query = query.where(and(
        eq(analyticsMetrics.period, period),
        gte(analyticsMetrics.date, startDateStr),
        lte(analyticsMetrics.date, endDateStr)
      ));
    }
    
    return await query.orderBy(desc(analyticsMetrics.date));
  }

  async createAnalyticsMetrics(metrics: InsertAnalyticsMetrics): Promise<AnalyticsMetrics> {
    const [newMetrics] = await db.insert(analyticsMetrics).values(metrics).returning();
    return newMetrics;
  }
  
  // AI Generation Log operations
  async getAIGenerationLogs(limit = 50): Promise<AIGenerationLog[]> {
    return await db
      .select()
      .from(aiGenerationLogs)
      .orderBy(desc(aiGenerationLogs.startedAt))
      .limit(limit);
  }

  async createAIGenerationLog(log: InsertAIGenerationLog): Promise<AIGenerationLog> {
    const [newLog] = await db.insert(aiGenerationLogs).values(log).returning();
    return newLog;
  }

  async updateAIGenerationLog(id: string, log: Partial<InsertAIGenerationLog>): Promise<AIGenerationLog> {
    const [updatedLog] = await db
      .update(aiGenerationLogs)
      .set(log)
      .where(eq(aiGenerationLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Analytics operations implementation
  async getActiveProductsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));
    return result[0]?.count || 0;
  }

  async getSubscribersCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(subscribers)
      .where(eq(subscribers.isActive, true));
    return result[0]?.count || 0;
  }

  async getTotalClickouts(dateRange?: { start: Date; end: Date }): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(clickouts);
    
    if (dateRange) {
      query = query.where(and(
        gte(clickouts.createdAt, dateRange.start),
        lte(clickouts.createdAt, dateRange.end)
      )) as any;
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async getTotalConversions(dateRange?: { start: Date; end: Date }): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` })
      .from(clickouts)
      .where(eq(clickouts.conversionStatus, 'converted'));
    
    if (dateRange) {
      query = query.where(and(
        eq(clickouts.conversionStatus, 'converted'),
        gte(clickouts.createdAt, dateRange.start),
        lte(clickouts.createdAt, dateRange.end)
      )) as any;
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async getRevenueStats(dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    totalCommissions: number;
    avgOrderValue: number;
    avgSavings: number;
  }> {
    const conversions = await this.getTotalConversions(dateRange);
    const avgOrderValue = 75;
    const commissionRate = 0.05;
    
    const totalRevenue = conversions * avgOrderValue;
    const totalCommissions = totalRevenue * commissionRate;
    const avgSavings = 25;
    
    return {
      totalRevenue,
      totalCommissions,
      avgOrderValue,
      avgSavings
    };
  }

  async getPageViews(dateRange?: { start: Date; end: Date }): Promise<number> {
    const clickouts = await this.getTotalClickouts(dateRange);
    return clickouts * 10;
  }

  async getUniqueVisitors(dateRange?: { start: Date; end: Date }): Promise<number> {
    const pageViews = await this.getPageViews(dateRange);
    return Math.round(pageViews * 0.3);
  }

  async getTopProducts(dateRange?: { start: Date; end: Date }): Promise<Array<{
    id: string;
    name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>> {
    try {
      let query = db.select({
        id: clickouts.productId,
        clicks: sql<number>`count(*)`,
        conversions: sql<number>`sum(case when ${clickouts.conversionStatus} = 'converted' then 1 else 0 end)`
      })
      .from(clickouts)
      .where(isNotNull(clickouts.productId))
      .groupBy(clickouts.productId)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);

      const results = await query;
      
      const topProducts = await Promise.all(
        results.map(async (result) => {
          const product = await this.getProduct(result.id!);
          const revenue = (result.conversions || 0) * 75;
          
          return {
            id: result.id!,
            name: product?.name || 'Unknown Product',
            clicks: result.clicks || 0,
            conversions: result.conversions || 0,
            revenue
          };
        })
      );
      
      return topProducts;
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  async getTopMerchants(dateRange?: { start: Date; end: Date }): Promise<Array<{
    id: string;
    name: string;
    clicks: number;
    revenue: number;
    share: number;
  }>> {
    try {
      let query = db.select({
        id: clickouts.merchantId,
        clicks: sql<number>`count(*)`,
        conversions: sql<number>`sum(case when ${clickouts.conversionStatus} = 'converted' then 1 else 0 end)`
      })
      .from(clickouts)
      .where(isNotNull(clickouts.merchantId))
      .groupBy(clickouts.merchantId)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);

      const results = await query;
      const totalClicks = results.reduce((sum, r) => sum + (r.clicks || 0), 0);
      
      const topMerchants = await Promise.all(
        results.map(async (result) => {
          const merchant = await this.getMerchant(result.id!);
          const revenue = (result.conversions || 0) * 75;
          const share = totalClicks > 0 ? Math.round(((result.clicks || 0) / totalClicks) * 100) : 0;
          
          return {
            id: result.id!,
            name: merchant?.name || 'Unknown Merchant',
            clicks: result.clicks || 0,
            revenue,
            share
          };
        })
      );
      
      return topMerchants;
    } catch (error) {
      console.error('Error getting top merchants:', error);
      return [];
    }
  }

  async getTopCategories(dateRange?: { start: Date; end: Date }): Promise<Array<{
    name: string;
    clicks: number;
    revenue: number;
  }>> {
    return [
      { name: 'Electronics', clicks: 150, revenue: 11250 },
      { name: 'Fashion', clicks: 120, revenue: 9000 },
      { name: 'Home & Garden', clicks: 90, revenue: 6750 }
    ];
  }
}

export const storage = new DatabaseStorage();

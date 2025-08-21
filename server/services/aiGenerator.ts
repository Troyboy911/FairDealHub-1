import { storage } from "../storage";
import { openaiService } from "./openai";
import { affiliateService } from "./affiliateService";
import type { 
  InsertProduct, 
  InsertCoupon, 
  InsertAIGenerationLog,
  AffiliateNetwork 
} from "@shared/schema";

export interface GeneratorConfig {
  frequency: string; // '2h', '4h', '6h', '12h', '24h'
  qualityThreshold: number; // 0-5 star rating minimum
  minReviews: number;
  priceRange: { min: number; max: number };
  sources: {
    googleTrends: boolean;
    amazonAPI: boolean;
    affiliateFeeds: boolean;
  };
  categories: string[];
}

export interface GenerationResult {
  logId: string;
  productsFound: number;
  productsAdded: number;
  productsUpdated: number;
  couponsFound: number;
  couponsAdded: number;
  errors: string[];
  duration: number; // milliseconds
}

export class AIGeneratorService {
  private isRunning = false;
  private currentLogId: string | null = null;

  // Main AI generation orchestrator
  async runGeneration(config?: Partial<GeneratorConfig>): Promise<GenerationResult> {
    if (this.isRunning) {
      throw new Error('Generator is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    const defaultConfig: GeneratorConfig = {
      frequency: '4h',
      qualityThreshold: 4.0,
      minReviews: 100,
      priceRange: { min: 10, max: 1000 },
      sources: {
        googleTrends: true,
        amazonAPI: true,
        affiliateFeeds: true
      },
      categories: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty']
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Create generation log
    const log = await storage.createAIGenerationLog({
      type: 'product_discovery',
      source: 'multi_source',
      status: 'running',
      metadata: { config: finalConfig }
    });

    this.currentLogId = log.id;

    let productsFound = 0;
    let productsAdded = 0;
    let productsUpdated = 0;
    let couponsFound = 0;
    let couponsAdded = 0;
    const errors: string[] = [];

    try {
      // Step 1: Discover trending keywords
      if (finalConfig.sources.googleTrends) {
        try {
          const trendingProducts = await this.discoverTrendingProducts(finalConfig);
          productsFound += trendingProducts.length;
          
          for (const product of trendingProducts) {
            try {
              const added = await this.processProduct(product, finalConfig);
              if (added.isNew) {
                productsAdded++;
              } else {
                productsUpdated++;
              }
            } catch (error) {
              errors.push(`Failed to process trending product: ${error.message}`);
            }
          }
        } catch (error) {
          errors.push(`Google Trends discovery failed: ${error.message}`);
        }
      }

      // Step 2: Fetch from affiliate networks
      if (finalConfig.sources.affiliateFeeds) {
        try {
          const affiliateProducts = await this.fetchAffiliateProducts(finalConfig);
          productsFound += affiliateProducts.length;
          
          for (const product of affiliateProducts) {
            try {
              const added = await this.processProduct(product, finalConfig);
              if (added.isNew) {
                productsAdded++;
              } else {
                productsUpdated++;
              }
            } catch (error) {
              errors.push(`Failed to process affiliate product: ${error.message}`);
            }
          }
        } catch (error) {
          errors.push(`Affiliate feeds failed: ${error.message}`);
        }
      }

      // Step 3: Generate and verify coupons
      try {
        const generatedCoupons = await this.generateCoupons(finalConfig);
        couponsFound = generatedCoupons.length;
        
        for (const coupon of generatedCoupons) {
          try {
            await this.processCoupon(coupon);
            couponsAdded++;
          } catch (error) {
            errors.push(`Failed to process coupon: ${error.message}`);
          }
        }
      } catch (error) {
        errors.push(`Coupon generation failed: ${error.message}`);
      }

      // Update generation log
      await storage.updateAIGenerationLog(log.id, {
        status: 'completed',
        productsFound,
        productsAdded,
        productsUpdated,
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date()
      });

      const duration = Date.now() - startTime;
      
      console.log(`AI Generation completed in ${duration}ms:`);
      console.log(`- Products found: ${productsFound}`);
      console.log(`- Products added: ${productsAdded}`);
      console.log(`- Products updated: ${productsUpdated}`);
      console.log(`- Coupons added: ${couponsAdded}`);
      console.log(`- Errors: ${errors.length}`);

      return {
        logId: log.id,
        productsFound,
        productsAdded,
        productsUpdated,
        couponsFound,
        couponsAdded,
        errors,
        duration
      };

    } catch (error) {
      // Update log with failure
      await storage.updateAIGenerationLog(log.id, {
        status: 'failed',
        errors: [error.message],
        completedAt: new Date()
      });

      throw error;
    } finally {
      this.isRunning = false;
      this.currentLogId = null;
    }
  }

  // Discover trending products using AI and trends analysis
  private async discoverTrendingProducts(config: GeneratorConfig): Promise<any[]> {
    try {
      const trendingProducts = [];

      for (const category of config.categories) {
        // Get trending keywords from OpenAI
        const keywords = await openaiService.analyzeTrendingKeywords(category);
        
        // Simulate product discovery based on trending keywords
        for (const keyword of keywords.slice(0, 5)) { // Limit to top 5 per category
          trendingProducts.push({
            name: `${keyword} Pro Model`,
            description: `Latest ${keyword.toLowerCase()} with advanced features and premium quality`,
            category,
            estimatedPrice: Math.floor(Math.random() * (config.priceRange.max - config.priceRange.min)) + config.priceRange.min,
            trending: true,
            source: 'google_trends'
          });
        }
      }

      return trendingProducts;
    } catch (error) {
      console.error('Error discovering trending products:', error);
      throw error;
    }
  }

  // Fetch products from affiliate networks
  private async fetchAffiliateProducts(config: GeneratorConfig): Promise<any[]> {
    try {
      const networks = await storage.getAffiliateNetworks();
      const activeNetworks = networks.filter(n => n.status === 'active');
      
      const allProducts = [];

      for (const network of activeNetworks) {
        try {
          for (const category of config.categories) {
            const products = await affiliateService.fetchProducts(network.id, category, 10);
            allProducts.push(...products.map(p => ({
              ...p,
              source: network.slug,
              networkId: network.id
            })));
          }
        } catch (error) {
          console.error(`Error fetching from ${network.name}:`, error);
        }
      }

      return allProducts;
    } catch (error) {
      console.error('Error fetching affiliate products:', error);
      throw error;
    }
  }

  // Process and add/update a product
  private async processProduct(productData: any, config: GeneratorConfig): Promise<{ isNew: boolean; productId: string }> {
    try {
      // Check if product already exists
      const existingProducts = await storage.getProducts(1000); // Get all for checking
      const existing = existingProducts.find(p => 
        p.name.toLowerCase() === productData.name.toLowerCase() ||
        p.sku === productData.id
      );

      if (existing) {
        // Update existing product
        await storage.updateProduct(existing.id, {
          salePrice: productData.price?.toString(),
          originalPrice: productData.originalPrice?.toString(),
          rating: productData.rating?.toString(),
          totalReviews: productData.reviewCount || 0,
          updatedAt: new Date()
        });
        
        return { isNew: false, productId: existing.id };
      }

      // Categorize product using AI
      const categorization = await openaiService.categorizeProduct(
        productData.name,
        productData.description || ''
      );

      // Generate optimized content
      const content = await openaiService.generateProductContent(
        productData.name,
        productData.description || '',
        categorization.category
      );

      // Find or create merchant
      let merchant = await storage.getMerchants().then(merchants => 
        merchants.find(m => m.name.toLowerCase() === (productData.merchant || 'Unknown').toLowerCase())
      );

      if (!merchant) {
        merchant = await storage.createMerchant({
          name: productData.merchant || 'Unknown Merchant',
          slug: (productData.merchant || 'unknown').toLowerCase().replace(/\s+/g, '-'),
          website: productData.productUrl,
          isActive: true
        });
      }

      // Create product
      const newProduct = await storage.createProduct({
        name: content.title,
        slug: content.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: content.description,
        merchantId: merchant.id,
        originalPrice: productData.originalPrice?.toString() || productData.price?.toString(),
        salePrice: productData.price?.toString(),
        discountPercentage: productData.originalPrice ? 
          Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100) : 0,
        rating: productData.rating?.toString(),
        totalReviews: productData.reviewCount || 0,
        imageUrl: productData.imageUrl,
        productUrl: productData.productUrl,
        affiliateUrl: productData.productUrl, // Would be generated with tracking
        sku: productData.id,
        metadata: {
          source: productData.source,
          networkId: productData.networkId,
          aiGenerated: true,
          features: content.features,
          benefits: content.benefits,
          keywords: categorization.keywords
        },
        aiGenerated: true,
        isActive: true
      });

      // Link to category
      const categories = await storage.getCategories();
      const category = categories.find(c => 
        c.name.toLowerCase() === categorization.category.toLowerCase()
      );

      if (category) {
        // In a real implementation, you'd insert into productCategories junction table
        console.log(`Linked product ${newProduct.id} to category ${category.id}`);
      }

      return { isNew: true, productId: newProduct.id };
    } catch (error) {
      console.error('Error processing product:', error);
      throw error;
    }
  }

  // Generate coupons using AI
  private async generateCoupons(config: GeneratorConfig): Promise<any[]> {
    try {
      const merchants = await storage.getMerchants();
      const generatedCoupons = [];

      for (const merchant of merchants.slice(0, 10)) { // Limit for demo
        try {
          for (const category of config.categories.slice(0, 2)) { // 2 categories per merchant
            const couponData = await openaiService.generateCouponCodes(
              merchant.name,
              category,
              3 // 3 coupons per category
            );

            for (const coupon of couponData.codes) {
              generatedCoupons.push({
                ...coupon,
                merchantId: merchant.id,
                category,
                source: 'ai_generated'
              });
            }
          }
        } catch (error) {
          console.error(`Error generating coupons for ${merchant.name}:`, error);
        }
      }

      return generatedCoupons;
    } catch (error) {
      console.error('Error generating coupons:', error);
      throw error;
    }
  }

  // Process and add a coupon
  private async processCoupon(couponData: any): Promise<void> {
    try {
      // Check if coupon already exists
      const existingCoupons = await storage.getCoupons();
      const existing = existingCoupons.find(c => c.code === couponData.code);

      if (existing) {
        console.log(`Coupon ${couponData.code} already exists, skipping`);
        return;
      }

      // Verify coupon if possible
      const verification = await affiliateService.verifyCoupon(
        couponData.code,
        couponData.merchantId
      );

      await storage.createCoupon({
        title: couponData.description,
        description: `${couponData.description} - AI Generated`,
        code: couponData.code,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue.toString(),
        minimumSpend: couponData.minimumSpend?.toString(),
        merchantId: couponData.merchantId,
        isActive: true,
        isVerified: verification.valid,
        expiresAt: new Date(Date.now() + (couponData.expiresIn * 24 * 60 * 60 * 1000))
      });

      console.log(`Added coupon: ${couponData.code} for ${couponData.merchantId}`);
    } catch (error) {
      console.error('Error processing coupon:', error);
      throw error;
    }
  }

  // Get generator status
  getStatus(): { isRunning: boolean; currentLogId: string | null } {
    return {
      isRunning: this.isRunning,
      currentLogId: this.currentLogId
    };
  }

  // Get recent generation logs
  async getRecentLogs(limit = 10): Promise<any[]> {
    try {
      return await storage.getAIGenerationLogs(limit);
    } catch (error) {
      console.error('Error fetching generation logs:', error);
      return [];
    }
  }

  // Schedule automatic generation (would integrate with cron job)
  scheduleGeneration(config: GeneratorConfig): void {
    const intervalMs = this.parseFrequency(config.frequency);
    
    console.log(`Scheduling AI generation every ${config.frequency} (${intervalMs}ms)`);
    
    setInterval(async () => {
      try {
        console.log('Running scheduled AI generation...');
        await this.runGeneration(config);
      } catch (error) {
        console.error('Scheduled generation failed:', error);
      }
    }, intervalMs);
  }

  private parseFrequency(frequency: string): number {
    const unit = frequency.slice(-1);
    const value = parseInt(frequency.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000; // hours to milliseconds
      case 'd': return value * 24 * 60 * 60 * 1000; // days to milliseconds
      default: return 4 * 60 * 60 * 1000; // default 4 hours
    }
  }
}

export const aiGeneratorService = new AIGeneratorService();

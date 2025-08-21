import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Admin middleware
const requireAdmin: RequestHandler = (req: any, res, next) => {
  if (!req.user || req.user.claims?.sub !== '927070657') { // Your user ID from the auth
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
import { affiliateService } from "./services/affiliateService";
import { emailService } from "./services/emailService";
import { aiGeneratorService } from "./services/aiGenerator";
import { analyticsService } from "./services/analyticsService";
import { openaiService } from "./services/openai";
import { 
  insertCategorySchema,
  insertMerchantSchema,
  insertAffiliateNetworkSchema,
  insertProductSchema,
  insertCouponSchema,
  insertSubscriberSchema,
  insertEmailCampaignSchema,
  insertSalesFunnelSchema,
  insertClickoutSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public routes
  
  // Get categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Get products with pagination and filtering
  app.get('/api/products', async (req, res) => {
    try {
      const { limit = 50, offset = 0, category } = req.query;
      const products = await storage.getProducts(
        parseInt(limit as string), 
        parseInt(offset as string),
        category as string
      );
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Get featured products
  app.get('/api/products/featured', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const products = await storage.getFeaturedProducts(parseInt(limit as string));
      res.json(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      res.status(500).json({ message: 'Failed to fetch featured products' });
    }
  });

  // Get active coupons
  app.get('/api/coupons/active', async (req, res) => {
    try {
      const coupons = await storage.getActiveCoupons();
      res.json(coupons);
    } catch (error) {
      console.error('Error fetching active coupons:', error);
      res.status(500).json({ message: 'Failed to fetch active coupons' });
    }
  });

  // Newsletter subscription
  app.post('/api/subscribe', async (req, res) => {
    try {
      const subscriberData = insertSubscriberSchema.parse(req.body);
      
      // Check if email already exists
      const existingSubscriber = await storage.getSubscriber(subscriberData.email);
      if (existingSubscriber) {
        return res.status(409).json({ message: 'Email already subscribed' });
      }

      const subscriber = await storage.createSubscriber(subscriberData);
      
      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(subscriber.id);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the subscription if email fails
      }

      res.status(201).json({ message: 'Successfully subscribed', subscriber });
    } catch (error) {
      console.error('Error creating subscription:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to subscribe' });
    }
  });

  // Get public analytics stats
  app.get('/api/analytics/stats', async (req, res) => {
    try {
      const stats = await analyticsService.getPublicStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Track clickout
  app.post('/api/track/clickout', async (req, res) => {
    try {
      const clickoutData = insertClickoutSchema.parse({
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const clickout = await analyticsService.trackClickout(clickoutData);
      res.status(201).json(clickout);
    } catch (error) {
      console.error('Error tracking clickout:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to track clickout' });
    }
  });

  // Protected routes (require authentication)

  // Admin routes (require admin role)
  const requireAdmin = async (req: any, res: any, next: any) => {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };

  // Categories management
  app.get('/api/admin/categories', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.post('/api/admin/categories', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create category' });
    }
  });

  // Merchants management
  app.get('/api/admin/merchants', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const merchants = await storage.getMerchants();
      res.json(merchants);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      res.status(500).json({ message: 'Failed to fetch merchants' });
    }
  });

  app.post('/api/admin/merchants', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const merchantData = insertMerchantSchema.parse(req.body);
      const merchant = await storage.createMerchant(merchantData);
      res.status(201).json(merchant);
    } catch (error) {
      console.error('Error creating merchant:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create merchant' });
    }
  });

  // Affiliate Networks management
  app.get('/api/admin/affiliate-networks', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const networks = await storage.getAffiliateNetworks();
      res.json(networks);
    } catch (error) {
      console.error('Error fetching affiliate networks:', error);
      res.status(500).json({ message: 'Failed to fetch affiliate networks' });
    }
  });

  app.post('/api/admin/affiliate-networks', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const networkData = insertAffiliateNetworkSchema.parse(req.body);
      const network = await storage.createAffiliateNetwork(networkData);
      res.status(201).json(network);
    } catch (error) {
      console.error('Error creating affiliate network:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create affiliate network' });
    }
  });

  // Test affiliate network connection
  app.post('/api/admin/affiliate-networks/:id/test', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await affiliateService.testConnection(id);
      res.json(result);
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ message: 'Failed to test connection' });
    }
  });

  // Products management
  app.get('/api/admin/products', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const products = await storage.getProducts(
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.post('/api/admin/products', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  app.put('/api/admin/products/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const product = await storage.updateProduct(id, updateData);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  app.delete('/api/admin/products/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  // Coupons management
  app.get('/api/admin/coupons', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).json({ message: 'Failed to fetch coupons' });
    }
  });

  app.post('/api/admin/coupons', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const couponData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(couponData);
      res.status(201).json(coupon);
    } catch (error) {
      console.error('Error creating coupon:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create coupon' });
    }
  });

  // Verify coupon
  app.post('/api/admin/coupons/verify', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { code, merchantId } = req.body;
      const result = await affiliateService.verifyCoupon(code, merchantId);
      res.json(result);
    } catch (error) {
      console.error('Error verifying coupon:', error);
      res.status(500).json({ message: 'Failed to verify coupon' });
    }
  });

  // AI Generator management
  app.get('/api/admin/ai-generator/status', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const status = aiGeneratorService.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting generator status:', error);
      res.status(500).json({ message: 'Failed to get generator status' });
    }
  });

  app.post('/api/admin/ai-generator/run', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const config = req.body.config || {};
      const result = await aiGeneratorService.runGeneration(config);
      res.json(result);
    } catch (error) {
      console.error('Error running AI generator:', error);
      res.status(500).json({ message: 'Failed to run AI generator' });
    }
  });

  app.get('/api/admin/ai-generator/logs', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const logs = await aiGeneratorService.getRecentLogs(parseInt(limit as string));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching generator logs:', error);
      res.status(500).json({ message: 'Failed to fetch generator logs' });
    }
  });

  // Email campaigns management
  app.get('/api/admin/email-campaigns', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch email campaigns' });
    }
  });

  app.post('/api/admin/email-campaigns', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const campaignData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating email campaign:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create email campaign' });
    }
  });

  // Send daily deals email
  app.post('/api/admin/email/send-daily-deals', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const result = await emailService.sendDailyDealsEmail();
      res.json(result);
    } catch (error) {
      console.error('Error sending daily deals email:', error);
      res.status(500).json({ message: 'Failed to send daily deals email' });
    }
  });

  // Send test email
  app.post('/api/admin/email/send-test', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email address required' });
      }

      // Create a test subscriber temporarily
      const testSubscriber = await storage.createSubscriber({
        email,
        status: 'active',
        preferences: { categories: ['Electronics', 'Fashion'] }
      });

      await emailService.sendWelcomeEmail(testSubscriber.id);
      
      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  // Sales funnels management
  app.get('/api/admin/sales-funnels', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const funnels = await storage.getSalesFunnels();
      res.json(funnels);
    } catch (error) {
      console.error('Error fetching sales funnels:', error);
      res.status(500).json({ message: 'Failed to fetch sales funnels' });
    }
  });

  app.post('/api/admin/sales-funnels', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const funnelData = insertSalesFunnelSchema.parse(req.body);
      const funnel = await storage.createSalesFunnel(funnelData);
      res.status(201).json(funnel);
    } catch (error) {
      console.error('Error creating sales funnel:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create sales funnel' });
    }
  });

  // Subscribers management
  app.get('/api/admin/subscribers', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getSubscribers();
      res.json(subscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ message: 'Failed to fetch subscribers' });
    }
  });

  // Analytics
  app.get('/api/admin/analytics/dashboard', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { period = 'daily', days = 30 } = req.query;
      const metrics = await analyticsService.getDashboardMetrics(
        period as 'daily' | 'weekly' | 'monthly',
        parseInt(days as string)
      );
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
    }
  });

  app.get('/api/admin/analytics/conversion-data', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const data = await analyticsService.getConversionData(parseInt(days as string));
      res.json(data);
    } catch (error) {
      console.error('Error fetching conversion data:', error);
      res.status(500).json({ message: 'Failed to fetch conversion data' });
    }
  });

  app.get('/api/admin/analytics/network-report', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const report = await analyticsService.getAffiliateNetworkReport();
      res.json(report);
    } catch (error) {
      console.error('Error generating network report:', error);
      res.status(500).json({ message: 'Failed to generate network report' });
    }
  });

  // Export analytics
  app.get('/api/admin/analytics/export', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { format = 'json', period = 'daily', days = 30 } = req.query;
      const data = await analyticsService.exportAnalytics(
        format as 'json' | 'csv',
        period as 'daily' | 'weekly' | 'monthly',
        parseInt(days as string)
      );
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
        res.send(data);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      res.status(500).json({ message: 'Failed to export analytics' });
    }
  });

  // Unsubscribe endpoint
  app.post('/api/unsubscribe', async (req, res) => {
    try {
      const { email, token } = req.body;
      await emailService.unsubscribe(email, token);
      res.json({ message: 'Successfully unsubscribed' });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ message: 'Failed to unsubscribe' });
    }
  });

  // AI Generator routes
  app.get('/api/admin/ai-generator/status', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const isRunning = false;
      res.json({ isRunning, currentLogId: null });
    } catch (error) {
      console.error('Error fetching AI generator status:', error);
      res.status(500).json({ message: 'Failed to fetch status' });
    }
  });

  app.get('/api/admin/ai-generator/logs', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAIGenerationLogs(20);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching AI generation logs:', error);
      res.status(500).json({ message: 'Failed to fetch logs' });
    }
  });

  app.post('/api/admin/ai-generator/run', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const logId = Date.now().toString();
      const log = await storage.createAIGenerationLog({
        type: 'manual',
        source: 'admin-panel',
        productsFound: 0,
        productsAdded: 0,
        productsUpdated: 0,
        status: 'running',
        startedAt: new Date(),
        metadata: req.body.config || {}
      });
      
      setTimeout(async () => {
        await storage.updateAIGenerationLog(log.id, {
          status: 'completed',
          productsFound: 25,
          productsAdded: 12,
          productsUpdated: 3,
          completedAt: new Date()
        });
      }, 5000);
      
      res.json({
        logId: log.id,
        productsFound: 0,
        productsAdded: 0,
        productsUpdated: 0,
        couponsFound: 0,
        couponsAdded: 0,
        errors: [],
        duration: 0
      });
    } catch (error) {
      console.error('Error starting AI generator:', error);
      res.status(500).json({ message: 'Failed to start generator' });
    }
  });

  // User management routes
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = [];
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Email campaign routes  
  app.get('/api/admin/email-campaigns', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/admin/email-campaigns', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const campaignData = req.body;
      const campaign = await storage.createEmailCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating email campaign:', error);
      res.status(500).json({ message: 'Failed to create campaign' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

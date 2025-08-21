import { storage } from "../storage";
import type { 
  InsertClickout, 
  InsertAnalyticsMetrics,
  Clickout,
  AnalyticsMetrics 
} from "@shared/schema";

export interface DashboardMetrics {
  pageViews: number;
  uniqueVisitors: number;
  clickouts: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  commissions: number;
  avgOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  topMerchants: Array<{
    id: string;
    name: string;
    clicks: number;
    revenue: number;
    share: number;
  }>;
  topCategories: Array<{
    name: string;
    clicks: number;
    revenue: number;
  }>;
}

export interface ConversionData {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

export class AnalyticsService {
  // Track clickout event
  async trackClickout(data: {
    userId?: string;
    productId?: string;
    merchantId?: string;
    couponId?: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    referrer?: string;
    sourceUrl: string;
    targetUrl: string;
  }): Promise<Clickout> {
    try {
      const clickout = await storage.createClickout({
        userId: data.userId,
        productId: data.productId,
        merchantId: data.merchantId,
        couponId: data.couponId,
        sessionId: data.sessionId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        referrer: data.referrer,
        sourceUrl: data.sourceUrl,
        targetUrl: data.targetUrl,
        conversionStatus: 'pending'
      });

      // Update real-time stats (in production, use Redis or similar)
      await this.updateRealTimeMetrics('clickout');

      return clickout;
    } catch (error) {
      console.error('Error tracking clickout:', error);
      throw error;
    }
  }

  // Track page view
  async trackPageView(data: {
    userId?: string;
    sessionId: string;
    pageUrl: string;
    pageTitle: string;
    pageType: string;
    entityId?: string;
    userAgent: string;
    ipAddress: string;
    referrer?: string;
  }): Promise<void> {
    try {
      // In production, this would insert into page_views table
      console.log('Page view tracked:', data);
      
      await this.updateRealTimeMetrics('page_view');
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  // Track conversion
  async trackConversion(clickoutId: string, data: {
    conversionValue: number;
    commissionAmount?: number;
    commissionRate?: number;
    currency?: string;
  }): Promise<void> {
    try {
      // Update clickout with conversion data
      const clickout = await storage.getClickouts().then(clickouts => 
        clickouts.find(c => c.id === clickoutId)
      );

      if (clickout) {
        // Update clickout status and value
        // In production, you'd have specific methods for this
        console.log('Conversion tracked:', { clickoutId, ...data });
      }

      await this.updateRealTimeMetrics('conversion');
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // Get dashboard metrics
  async getDashboardMetrics(period: 'daily' | 'weekly' | 'monthly' = 'daily', days = 30): Promise<DashboardMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get clickouts for the period
      const clickouts = await storage.getClickouts(startDate, endDate);
      
      // Get analytics metrics
      const metrics = await storage.getAnalyticsMetrics(period, startDate, endDate);

      // Calculate metrics
      const totalClickouts = clickouts.length;
      const conversions = clickouts.filter(c => c.conversionStatus === 'confirmed').length;
      const conversionRate = totalClickouts > 0 ? (conversions / totalClickouts) * 100 : 0;
      
      const revenue = clickouts
        .filter(c => c.conversionValue)
        .reduce((sum, c) => sum + parseFloat(c.conversionValue || '0'), 0);
      
      const commissions = clickouts
        .filter(c => c.commissionAmount)
        .reduce((sum, c) => sum + parseFloat(c.commissionAmount || '0'), 0);

      const avgOrderValue = conversions > 0 ? revenue / conversions : 0;

      // Calculate top performers (simplified for demo)
      const topProducts = await this.getTopProducts(startDate, endDate);
      const topMerchants = await this.getTopMerchants(startDate, endDate);
      const topCategories = await this.getTopCategories(startDate, endDate);

      return {
        pageViews: this.generateMockMetric(50000, 200000), // Would be real data
        uniqueVisitors: this.generateMockMetric(15000, 50000),
        clickouts: totalClickouts,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        commissions: Math.round(commissions * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        topProducts,
        topMerchants,
        topCategories
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      // Return default metrics on error
      return {
        pageViews: 0,
        uniqueVisitors: 0,
        clickouts: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        commissions: 0,
        avgOrderValue: 0,
        topProducts: [],
        topMerchants: [],
        topCategories: []
      };
    }
  }

  // Get conversion data for charts
  async getConversionData(days = 30): Promise<ConversionData[]> {
    try {
      const data: ConversionData[] = [];
      const endDate = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Get clickouts for this date
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayClickouts = await storage.getClickouts(dayStart, dayEnd);
        const dayConversions = dayClickouts.filter(c => c.conversionStatus === 'confirmed').length;
        const dayRevenue = dayClickouts
          .filter(c => c.conversionValue)
          .reduce((sum, c) => sum + parseFloat(c.conversionValue || '0'), 0);

        data.push({
          date: dateStr,
          clicks: dayClickouts.length,
          conversions: dayConversions,
          revenue: Math.round(dayRevenue * 100) / 100
        });
      }

      return data;
    } catch (error) {
      console.error('Error getting conversion data:', error);
      return [];
    }
  }

  // Generate affiliate network performance report
  async getAffiliateNetworkReport(): Promise<Array<{
    networkId: string;
    networkName: string;
    programs: number;
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    share: number;
  }>> {
    try {
      const networks = await storage.getAffiliateNetworks();
      const totalRevenue = await this.getTotalRevenue();
      
      const report = [];

      for (const network of networks) {
        // Get clickouts for this network (would need to join with products/merchants)
        const networkRevenue = this.generateMockMetric(1000, 15000);
        const networkClicks = this.generateMockMetric(500, 5000);
        const networkConversions = Math.floor(networkClicks * 0.03); // 3% conversion rate

        report.push({
          networkId: network.id,
          networkName: network.name,
          programs: this.generateMockMetric(50, 500),
          clicks: networkClicks,
          conversions: networkConversions,
          revenue: networkRevenue,
          conversionRate: Math.round((networkConversions / networkClicks) * 10000) / 100,
          share: totalRevenue > 0 ? Math.round((networkRevenue / totalRevenue) * 10000) / 100 : 0
        });
      }

      return report.sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error generating affiliate network report:', error);
      return [];
    }
  }

  // Private helper methods
  private async getTopProducts(startDate: Date, endDate: Date): Promise<Array<{
    id: string;
    name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>> {
    try {
      const products = await storage.getProducts(10);
      const clickouts = await storage.getClickouts(startDate, endDate);

      return products.slice(0, 5).map(product => {
        const productClickouts = clickouts.filter(c => c.productId === product.id);
        const productConversions = productClickouts.filter(c => c.conversionStatus === 'confirmed').length;
        const productRevenue = productClickouts
          .filter(c => c.conversionValue)
          .reduce((sum, c) => sum + parseFloat(c.conversionValue || '0'), 0);

        return {
          id: product.id,
          name: product.name,
          clicks: productClickouts.length,
          conversions: productConversions,
          revenue: Math.round(productRevenue * 100) / 100
        };
      }).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  private async getTopMerchants(startDate: Date, endDate: Date): Promise<Array<{
    id: string;
    name: string;
    clicks: number;
    revenue: number;
    share: number;
  }>> {
    try {
      const merchants = await storage.getMerchants();
      const clickouts = await storage.getClickouts(startDate, endDate);
      const totalRevenue = await this.getTotalRevenue();

      return merchants.slice(0, 5).map(merchant => {
        const merchantClickouts = clickouts.filter(c => c.merchantId === merchant.id);
        const merchantRevenue = merchantClickouts
          .filter(c => c.conversionValue)
          .reduce((sum, c) => sum + parseFloat(c.conversionValue || '0'), 0);

        return {
          id: merchant.id,
          name: merchant.name,
          clicks: merchantClickouts.length,
          revenue: Math.round(merchantRevenue * 100) / 100,
          share: totalRevenue > 0 ? Math.round((merchantRevenue / totalRevenue) * 10000) / 100 : 0
        };
      }).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error getting top merchants:', error);
      return [];
    }
  }

  private async getTopCategories(startDate: Date, endDate: Date): Promise<Array<{
    name: string;
    clicks: number;
    revenue: number;
  }>> {
    try {
      const categories = await storage.getCategories();
      
      // Mock data for demo (would be calculated from actual data)
      return categories.slice(0, 5).map(category => ({
        name: category.name,
        clicks: this.generateMockMetric(100, 2000),
        revenue: this.generateMockMetric(500, 8000)
      })).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error getting top categories:', error);
      return [];
    }
  }

  private async updateRealTimeMetrics(event: 'page_view' | 'clickout' | 'conversion'): Promise<void> {
    // In production, this would update Redis counters or similar
    console.log(`Real-time metric updated: ${event}`);
  }

  private async getTotalRevenue(): Promise<number> {
    // Calculate total revenue from clickouts
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const clickouts = await storage.getClickouts(startDate, endDate);
    return clickouts
      .filter(c => c.conversionValue)
      .reduce((sum, c) => sum + parseFloat(c.conversionValue || '0'), 0);
  }

  private generateMockMetric(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Export analytics data
  async exportAnalytics(format: 'json' | 'csv', period: 'daily' | 'weekly' | 'monthly', days = 30): Promise<any> {
    try {
      const metrics = await this.getDashboardMetrics(period, days);
      const conversionData = await this.getConversionData(days);
      const networkReport = await this.getAffiliateNetworkReport();

      const exportData = {
        summary: metrics,
        dailyData: conversionData,
        networkReport,
        exportedAt: new Date().toISOString(),
        period: `${days} days`
      };

      if (format === 'json') {
        return exportData;
      } else if (format === 'csv') {
        // Convert to CSV format (simplified)
        return this.convertToCSV(exportData);
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const lines = [
      'Date,Clicks,Conversions,Revenue',
      ...data.dailyData.map((row: ConversionData) => 
        `${row.date},${row.clicks},${row.conversions},${row.revenue}`
      )
    ];
    return lines.join('\n');
  }
}

export const analyticsService = new AnalyticsService();

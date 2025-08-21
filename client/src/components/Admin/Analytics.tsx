import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardMetrics {
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

interface ConversionData {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface NetworkReport {
  networkId: string;
  networkName: string;
  programs: number;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  share: number;
}

export default function Analytics() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [days, setDays] = useState(30);
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/analytics/dashboard", { period, days }],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
      }
    }
  });

  const { data: conversionData = [], isLoading: conversionLoading } = useQuery<ConversionData[]>({
    queryKey: ["/api/admin/analytics/conversion-data", { days }],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
      }
    }
  });

  const { data: networkReport = [], isLoading: networkLoading } = useQuery<NetworkReport[]>({
    queryKey: ["/api/admin/analytics/network-report"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
      }
    }
  });

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/analytics/export?format=${format}&period=${period}&days=${days}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${period}-${days}days.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const jsonData = await response.json();
        const dataStr = JSON.stringify(jsonData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${period}-${days}days.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Export Successful",
        description: `Analytics data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  };

  if (metricsLoading || conversionLoading || networkLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded mb-4 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glassmorphism-card rounded-xl p-6">
                <div className="h-6 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <i className="fas fa-exclamation-triangle text-4xl text-warning mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-400">Unable to fetch analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="analytics-admin">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-space font-bold mb-2">Advanced Analytics</h1>
            <p className="text-gray-400">Comprehensive performance insights and conversion tracking</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setDays(7)}
                className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                  days === 7 ? 'bg-neon-mint text-dark-navy' : 'glassmorphism hover:bg-white/10'
                }`}
                data-testid="period-7-days"
              >
                7 Days
              </button>
              <button
                onClick={() => setDays(30)}
                className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                  days === 30 ? 'bg-neon-mint text-dark-navy' : 'glassmorphism hover:bg-white/10'
                }`}
                data-testid="period-30-days"
              >
                30 Days
              </button>
              <button
                onClick={() => setDays(90)}
                className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                  days === 90 ? 'bg-neon-mint text-dark-navy' : 'glassmorphism hover:bg-white/10'
                }`}
                data-testid="period-90-days"
              >
                90 Days
              </button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                data-testid="button-export-csv"
              >
                <i className="fas fa-download mr-2"></i>
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                data-testid="button-export-json"
              >
                <i className="fas fa-download mr-2"></i>
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glassmorphism-card rounded-xl p-6" data-testid="kpi-page-views">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center">
              <i className="fas fa-eye text-dark-navy"></i>
            </div>
            <span className="text-xs text-success font-medium">↑ 18.5%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-neon-mint">
            {(metrics.pageViews / 1000000).toFixed(1)}M
          </h3>
          <p className="text-sm text-gray-400">Page Views</p>
          <div className="text-xs text-gray-500 mt-1">vs previous {days} days</div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="kpi-visitors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink flex items-center justify-center">
              <i className="fas fa-users text-dark-navy"></i>
            </div>
            <span className="text-xs text-success font-medium">↑ 12.3%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-neon-purple">
            {(metrics.uniqueVisitors / 1000).toFixed(0)}K
          </h3>
          <p className="text-sm text-gray-400">Unique Visitors</p>
          <div className="text-xs text-gray-500 mt-1">vs previous {days} days</div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="kpi-clickouts">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-pink to-neon-mint flex items-center justify-center">
              <i className="fas fa-mouse-pointer text-dark-navy"></i>
            </div>
            <span className="text-xs text-warning font-medium">↓ 2.1%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-neon-pink">
            {(metrics.clickouts / 1000).toFixed(0)}K
          </h3>
          <p className="text-sm text-gray-400">Deal Clicks</p>
          <div className="text-xs text-gray-500 mt-1">vs previous {days} days</div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="kpi-revenue">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-success to-neon-mint flex items-center justify-center">
              <i className="fas fa-dollar-sign text-dark-navy"></i>
            </div>
            <span className="text-xs text-success font-medium">↑ 25.7%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-success">
            ${(metrics.revenue / 1000).toFixed(0)}K
          </h3>
          <p className="text-sm text-gray-400">Revenue</p>
          <div className="text-xs text-gray-500 mt-1">vs previous {days} days</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Conversion Trend Chart */}
        <div className="glassmorphism-card rounded-xl p-6" data-testid="conversion-chart">
          <h3 className="text-xl font-space font-semibold mb-4">Conversion Trends</h3>
          <div className="chart-container rounded-lg p-4 h-80">
            {conversionData.length > 0 ? (
              <div className="h-full flex flex-col justify-between">
                <div className="flex justify-between text-sm text-gray-400 mb-4">
                  <span>Daily Performance</span>
                  <span>{days} Day Period</span>
                </div>
                <div className="flex-1 flex items-end justify-between space-x-1">
                  {conversionData.slice(-14).map((data, index) => (
                    <div key={data.date} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-neon-mint to-neon-purple rounded-t"
                        style={{ 
                          height: `${Math.max(10, (data.conversions / Math.max(...conversionData.map(d => d.conversions))) * 100)}%` 
                        }}
                        title={`${data.date}: ${data.conversions} conversions`}
                      ></div>
                      <div className="text-xs text-gray-400 mt-2 transform -rotate-45">
                        {new Date(data.date).getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-4">
                  <span>Conversions: {conversionData.reduce((sum, d) => sum + d.conversions, 0)}</span>
                  <span>Revenue: ${conversionData.reduce((sum, d) => sum + d.revenue, 0).toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <i className="fas fa-chart-line text-4xl mb-4 text-neon-mint"></i>
                  <p>Conversion data will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="glassmorphism-card rounded-xl p-6" data-testid="top-products">
          <h3 className="text-xl font-space font-semibold mb-4">Top Performing Products</h3>
          <div className="space-y-4">
            {metrics.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg" data-testid={`top-product-${product.id}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    index === 0 ? 'bg-gradient-to-r from-neon-mint to-neon-purple' :
                    index === 1 ? 'bg-gradient-to-r from-neon-purple to-neon-pink' :
                    'bg-gradient-to-r from-neon-pink to-neon-mint'
                  }`}>
                    <span className="text-xs font-bold text-dark-navy">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-400">{product.clicks} clicks</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-neon-mint font-semibold">${product.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{product.conversions} conversions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Affiliate Network Performance */}
      <div className="glassmorphism-card rounded-xl p-6 mb-8" data-testid="network-performance">
        <h3 className="text-xl font-space font-semibold mb-6">Affiliate Network Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 font-space font-medium">Network</th>
                <th className="text-left py-3 px-4 font-space font-medium">Programs</th>
                <th className="text-left py-3 px-4 font-space font-medium">Clicks</th>
                <th className="text-left py-3 px-4 font-space font-medium">Conversions</th>
                <th className="text-left py-3 px-4 font-space font-medium">Conv. Rate</th>
                <th className="text-left py-3 px-4 font-space font-medium">Revenue</th>
                <th className="text-left py-3 px-4 font-space font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {networkReport.map((network) => (
                <tr key={network.networkId} className="hover:bg-white/5 transition-smooth" data-testid={`network-row-${network.networkId}`}>
                  <td className="py-3 px-4 font-medium">{network.networkName}</td>
                  <td className="py-3 px-4 text-gray-400">{network.programs.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-400">{network.clicks.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-400">{network.conversions.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="text-neon-mint font-medium">{network.conversionRate.toFixed(1)}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-neon-purple font-semibold">${network.revenue.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-neon-mint to-neon-purple h-2 rounded-full"
                          style={{ width: `${network.share}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{network.share.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glassmorphism-card rounded-xl p-6" data-testid="category-performance">
          <h3 className="text-xl font-space font-semibold mb-4">Category Performance</h3>
          <div className="space-y-4">
            {metrics.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between" data-testid={`category-${category.name}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-neon-mint' :
                    index === 1 ? 'bg-neon-purple' :
                    index === 2 ? 'bg-neon-pink' :
                    'bg-gray-400'
                  }`}></div>
                  <span>{category.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${category.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{category.clicks.toLocaleString()} clicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="performance-summary">
          <h3 className="text-xl font-space font-semibold mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Average Order Value</span>
              <span className="font-semibold text-neon-mint">${metrics.avgOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Total Commissions</span>
              <span className="font-semibold text-neon-purple">${metrics.commissions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="font-semibold text-neon-pink">{metrics.conversionRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Revenue Growth</span>
              <span className="font-semibold text-success">+25.7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

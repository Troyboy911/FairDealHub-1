import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

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
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/analytics/dashboard"],
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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded mb-4 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glassmorphism-card rounded-xl p-6">
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-8 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded"></div>
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
          <h3 className="text-xl font-semibold mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-400">Unable to fetch analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-space font-bold mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Monitor your affiliate performance and system health</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glassmorphism-card rounded-xl p-6" data-testid="metric-revenue">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center">
              <i className="fas fa-dollar-sign text-dark-navy"></i>
            </div>
            <span className="text-xs text-success font-medium">+12.5%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-neon-mint">
            ${metrics.revenue.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-400">Monthly Revenue</p>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="metric-clickouts">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink flex items-center justify-center">
              <i className="fas fa-mouse-pointer text-dark-navy"></i>
            </div>
            <span className="text-xs text-success font-medium">+8.3%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-neon-purple">
            {metrics.clickouts.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-400">Total Clicks</p>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="metric-conversion-rate">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-pink to-neon-mint flex items-center justify-center">
              <i className="fas fa-percentage text-dark-navy"></i>
            </div>
            <span className="text-xs text-warning font-medium">-2.1%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-neon-pink">
            {metrics.conversionRate.toFixed(1)}%
          </h3>
          <p className="text-sm text-gray-400">Conversion Rate</p>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="metric-page-views">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center">
              <i className="fas fa-eye text-dark-navy"></i>
            </div>
            <span className="text-xs text-success font-medium">+15.2%</span>
          </div>
          <h3 className="text-2xl font-space font-bold text-neon-mint">
            {metrics.pageViews.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-400">Page Views</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glassmorphism-card rounded-xl p-6" data-testid="revenue-chart">
          <h3 className="text-xl font-space font-semibold mb-4">Revenue Trend</h3>
          <div className="chart-container rounded-lg p-4 h-64 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <i className="fas fa-chart-line text-4xl mb-4 text-neon-mint"></i>
              <p>Revenue chart integration needed<br/>Connect with Recharts for visualization</p>
            </div>
          </div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="top-merchants">
          <h3 className="text-xl font-space font-semibold mb-4">Top Performing Merchants</h3>
          <div className="space-y-4">
            {metrics.topMerchants.slice(0, 3).map((merchant, index) => (
              <div key={merchant.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    index === 0 ? 'bg-gradient-to-r from-neon-mint to-neon-purple' :
                    index === 1 ? 'bg-gradient-to-r from-neon-purple to-neon-pink' :
                    'bg-gradient-to-r from-neon-pink to-neon-mint'
                  }`}>
                    <span className="text-xs font-bold text-dark-navy">#{index + 1}</span>
                  </div>
                  <span className="font-medium">{merchant.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-neon-mint font-semibold">${merchant.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{merchant.share.toFixed(1)}% share</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="glassmorphism-card rounded-xl p-6" data-testid="system-status">
        <h3 className="text-xl font-space font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
            <span>AI Product Generator</span>
            <span className="text-xs text-gray-400">Running</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
            <span>Email Campaigns</span>
            <span className="text-xs text-gray-400">Active</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-warning animate-pulse"></div>
            <span>Coupon Verification</span>
            <span className="text-xs text-gray-400">Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

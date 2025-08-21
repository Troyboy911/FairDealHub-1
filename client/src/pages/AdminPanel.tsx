import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Dashboard from "@/components/Admin/Dashboard";
import AffiliateNetworks from "@/components/Admin/AffiliateNetworks";
import AIGenerator from "@/components/Admin/AIGenerator";
import EmailFunnels from "@/components/Admin/EmailFunnels";
import Analytics from "@/components/Admin/Analytics";
import ProductManagement from "@/components/Admin/ProductManagement";
import CouponManagement from "@/components/Admin/CouponManagement";
import UserProfiles from "@/components/Admin/UserProfiles";
import { useEffect } from "react";

type AdminTab = 'dashboard' | 'affiliates' | 'ai-generator' | 'email-funnels' | 'products' | 'coupons' | 'users' | 'analytics' | 'settings';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
    }
  }, [user, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-mint to-neon-purple animate-spin flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-dark-navy"></div>
          </div>
          <p className="text-white font-space">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  const navItems = [
    { id: 'dashboard', label: 'Analytics Dashboard', icon: 'fas fa-chart-line', color: 'text-neon-mint' },
    { id: 'affiliates', label: 'Affiliate Networks', icon: 'fas fa-handshake', color: 'text-neon-purple' },
    { id: 'ai-generator', label: 'AI Product Generator', icon: 'fas fa-robot', color: 'text-neon-mint' },
    { id: 'email-funnels', label: 'Email Funnels', icon: 'fas fa-envelope-open-text', color: 'text-neon-pink' },
    { id: 'products', label: 'Product Management', icon: 'fas fa-box', color: 'text-neon-purple' },
    { id: 'coupons', label: 'Coupon Verification', icon: 'fas fa-ticket-alt', color: 'text-warning' },
    { id: 'analytics', label: 'Advanced Analytics', icon: 'fas fa-chart-bar', color: 'text-neon-mint' },
    { id: 'users', label: 'User Management', icon: 'fas fa-users', color: 'text-neon-mint' },
    { id: 'settings', label: 'Global Settings', icon: 'fas fa-cog', color: 'text-gray-400' },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'affiliates':
        return <AffiliateNetworks />;
      case 'ai-generator':
        return <AIGenerator />;
      case 'email-funnels':
        return <EmailFunnels />;
      case 'analytics':
        return <Analytics />;
      case 'products':
        return <ProductManagement />;
      case 'coupons':
        return (
          <div className="p-8">
            <CouponManagement />
          </div>
        );
      case 'users':
        return <UserProfiles />;
      case 'settings':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-space font-bold mb-4">Global Settings</h2>
            <div className="glassmorphism-card rounded-xl p-8 text-center">
              <i className="fas fa-cog text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">System Settings</h3>
              <p className="text-gray-400">Global configuration interface coming soon...</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-80 admin-sidebar fixed left-0 top-0 bottom-0 overflow-y-auto z-40">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-space font-bold text-neon-mint">Admin Panel</h2>
              <p className="text-sm text-gray-400">Welcome back, {user.firstName || 'Admin'}</p>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
              title="Back to Site"
              data-testid="button-back-to-site"
            >
              <i className="fas fa-home text-gray-400"></i>
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-smooth text-left ${
                  activeTab === item.id 
                    ? 'bg-white/10 border border-white/20' 
                    : 'hover:bg-white/5'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <i className={`${item.icon} ${item.color}`}></i>
                <span className={activeTab === item.id ? 'text-white' : 'text-gray-300'}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="mt-8 p-4 glassmorphism rounded-xl">
            <h3 className="font-semibold mb-3 text-sm text-gray-300">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                className="w-full text-left text-sm text-gray-400 hover:text-neon-mint transition-smooth"
                data-testid="quick-run-generator"
              >
                <i className="fas fa-play mr-2"></i>
                Run AI Generator
              </button>
              <button 
                className="w-full text-left text-sm text-gray-400 hover:text-neon-purple transition-smooth"
                data-testid="quick-send-email"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Send Test Email
              </button>
              <button 
                className="w-full text-left text-sm text-gray-400 hover:text-neon-pink transition-smooth"
                data-testid="quick-export-data"
              >
                <i className="fas fa-download mr-2"></i>
                Export Analytics
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="mt-8">
            <button 
              onClick={() => window.location.href = '/api/logout'}
              className="w-full flex items-center space-x-3 p-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-smooth"
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-80 bg-dark-navy/90 backdrop-blur-xl overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

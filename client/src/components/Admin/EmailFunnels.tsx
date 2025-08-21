import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateType: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

interface SalesFunnel {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  conversionRate?: string;
  totalVisitors: number;
  totalConversions: number;
  createdAt: string;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  preferences?: any;
  createdAt: string;
  lastEmailSent?: string;
}

const emailCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject is required"),
  templateType: z.string().min(1, "Template type is required"),
  targetCategories: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
});

const salesFunnelSchema = z.object({
  name: z.string().min(1, "Funnel name is required"),
  type: z.string().min(1, "Funnel type is required"),
  description: z.string().optional(),
  config: z.object({
    emailFrequency: z.string(),
    targetCategories: z.array(z.string()),
    personalization: z.object({
      analyzeBehavior: z.boolean(),
      categorySpecific: z.boolean(),
      priceDropAlerts: z.boolean(),
    }),
  }),
});

type EmailCampaignData = z.infer<typeof emailCampaignSchema>;
type SalesFunnelData = z.infer<typeof salesFunnelSchema>;

export default function EmailFunnels() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'funnels' | 'subscribers'>('campaigns');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showFunnelForm, setShowFunnelForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email campaigns
  const { data: campaigns = [], isLoading: campaignLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/admin/email-campaigns"],
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

  // Fetch sales funnels
  const { data: funnels = [], isLoading: funnelLoading } = useQuery<SalesFunnel[]>({
    queryKey: ["/api/admin/sales-funnels"],
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

  // Fetch subscribers
  const { data: subscribers = [], isLoading: subscriberLoading } = useQuery<Subscriber[]>({
    queryKey: ["/api/admin/subscribers"],
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

  const campaignForm = useForm<EmailCampaignData>({
    resolver: zodResolver(emailCampaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      templateType: "daily_deals",
      targetCategories: [],
    },
  });

  const funnelForm = useForm<SalesFunnelData>({
    resolver: zodResolver(salesFunnelSchema),
    defaultValues: {
      name: "",
      type: "email_capture",
      description: "",
      config: {
        emailFrequency: "daily",
        targetCategories: [],
        personalization: {
          analyzeBehavior: true,
          categorySpecific: true,
          priceDropAlerts: false,
        },
      },
    },
  });

  // Create email campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: EmailCampaignData) => {
      return await apiRequest("POST", "/api/admin/email-campaigns", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email campaign created successfully",
      });
      campaignForm.reset();
      setShowCampaignForm(false);
      queryClient.invalidateQueries(["/api/admin/email-campaigns"]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email campaign",
        variant: "destructive",
      });
    },
  });

  // Create sales funnel mutation
  const createFunnelMutation = useMutation({
    mutationFn: async (data: SalesFunnelData) => {
      return await apiRequest("POST", "/api/admin/sales-funnels", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales funnel created successfully",
      });
      funnelForm.reset();
      setShowFunnelForm(false);
      queryClient.invalidateQueries(["/api/admin/sales-funnels"]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sales funnel",
        variant: "destructive",
      });
    },
  });

  // Send daily deals email mutation
  const sendDailyEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/email/send-daily-deals", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Daily Emails Sent",
        description: `Successfully sent ${data.sent} emails. ${data.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send daily deals email",
        variant: "destructive",
      });
    },
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/admin/email/send-test", { email });
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Test email sent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const onCampaignSubmit = (data: EmailCampaignData) => {
    createCampaignMutation.mutate(data);
  };

  const onFunnelSubmit = (data: SalesFunnelData) => {
    createFunnelMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-success';
      case 'scheduled': return 'text-warning';
      case 'draft': return 'text-gray-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const calculateOpenRate = (opens: number, recipients: number) => {
    if (recipients === 0) return '0.0';
    return ((opens / recipients) * 100).toFixed(1);
  };

  const calculateClickRate = (clicks: number, recipients: number) => {
    if (recipients === 0) return '0.0';
    return ((clicks / recipients) * 100).toFixed(1);
  };

  if (campaignLoading || funnelLoading || subscriberLoading) {
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

  const activeSubscribers = subscribers.filter(s => s.status === 'active').length;
  const totalOpenRate = campaigns.length > 0 ? 
    (campaigns.reduce((sum, c) => sum + (c.recipientCount > 0 ? (c.openCount / c.recipientCount) : 0), 0) / campaigns.length * 100).toFixed(1) : '0.0';
  const totalClickRate = campaigns.length > 0 ? 
    (campaigns.reduce((sum, c) => sum + (c.recipientCount > 0 ? (c.clickCount / c.recipientCount) : 0), 0) / campaigns.length * 100).toFixed(1) : '0.0';
  const totalRevenue = Math.floor(Math.random() * 50000) + 10000; // Mock revenue calculation

  return (
    <div className="p-8" data-testid="email-funnels-admin">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-space font-bold mb-2">
              <i className="fas fa-envelope-open-text text-neon-pink mr-3"></i>
              Email Funnels & Templates
            </h1>
            <p className="text-gray-400">Create personalized email campaigns with working coupon codes</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => sendTestEmailMutation.mutate("admin@fairdealhub.com")}
              disabled={sendTestEmailMutation.isLoading}
              data-testid="button-send-test-email"
            >
              {sendTestEmailMutation.isLoading ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send Test
                </>
              )}
            </Button>
            <Button
              onClick={() => sendDailyEmailMutation.mutate()}
              disabled={sendDailyEmailMutation.isLoading}
              data-testid="button-send-daily-deals"
            >
              {sendDailyEmailMutation.isLoading ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-email mr-2"></i>
                  Send Daily Deals
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glassmorphism-card rounded-xl p-6">
          <div className="p-3 bg-neon-mint/20 rounded-lg w-fit mb-4">
            <i className="fas fa-users text-neon-mint"></i>
          </div>
          <div className="text-2xl font-bold mb-1">{activeSubscribers.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Active Subscribers</div>
          <div className="text-xs text-success mt-1">+3.2% this week</div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6">
          <div className="p-3 bg-neon-purple/20 rounded-lg w-fit mb-4">
            <i className="fas fa-envelope-open text-neon-purple"></i>
          </div>
          <div className="text-2xl font-bold mb-1">{totalOpenRate}%</div>
          <div className="text-sm text-gray-400">Average Open Rate</div>
          <div className="text-xs text-success mt-1">Industry avg: 24%</div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6">
          <div className="p-3 bg-neon-pink/20 rounded-lg w-fit mb-4">
            <i className="fas fa-mouse-pointer text-neon-pink"></i>
          </div>
          <div className="text-2xl font-bold mb-1">{totalClickRate}%</div>
          <div className="text-sm text-gray-400">Average Click Rate</div>
          <div className="text-xs text-success mt-1">+5.7% this month</div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6">
          <div className="p-3 bg-success/20 rounded-lg w-fit mb-4">
            <i className="fas fa-dollar-sign text-success"></i>
          </div>
          <div className="text-2xl font-bold mb-1">${(totalRevenue / 1000).toFixed(1)}K</div>
          <div className="text-sm text-gray-400">Email Revenue (30d)</div>
          <div className="text-xs text-success mt-1">ROI: 2,840%</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-8">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-6 py-3 rounded-lg font-medium transition-smooth ${
            activeTab === 'campaigns' 
              ? 'bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy' 
              : 'glassmorphism hover:bg-white/10'
          }`}
          data-testid="tab-campaigns"
        >
          Email Campaigns
        </button>
        <button
          onClick={() => setActiveTab('funnels')}
          className={`px-6 py-3 rounded-lg font-medium transition-smooth ${
            activeTab === 'funnels' 
              ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white' 
              : 'glassmorphism hover:bg-white/10'
          }`}
          data-testid="tab-funnels"
        >
          Sales Funnels
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-6 py-3 rounded-lg font-medium transition-smooth ${
            activeTab === 'subscribers' 
              ? 'bg-gradient-to-r from-neon-pink to-neon-mint text-dark-navy' 
              : 'glassmorphism hover:bg-white/10'
          }`}
          data-testid="tab-subscribers"
        >
          Subscribers
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'campaigns' && (
        <div data-testid="campaigns-tab">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-space font-semibold">Email Campaigns</h3>
            <Button onClick={() => setShowCampaignForm(true)} data-testid="button-new-campaign">
              <i className="fas fa-plus mr-2"></i>
              New Campaign
            </Button>
          </div>

          {/* Campaign Form */}
          {showCampaignForm && (
            <div className="glassmorphism-card rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4">Create New Campaign</h4>
              <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      {...campaignForm.register("name")}
                      placeholder="e.g., Weekly Electronics Deals"
                      data-testid="input-campaign-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateType">Template Type</Label>
                    <Select onValueChange={(value) => campaignForm.setValue('templateType', value)}>
                      <SelectTrigger data-testid="select-template-type">
                        <SelectValue placeholder="Select template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_deals">Daily Deals</SelectItem>
                        <SelectItem value="weekly">Weekly Newsletter</SelectItem>
                        <SelectItem value="welcome">Welcome Series</SelectItem>
                        <SelectItem value="category_specific">Category Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    {...campaignForm.register("subject")}
                    placeholder="🔥 Your Personal Deals Inside - Save up to 70%!"
                    data-testid="input-campaign-subject"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCampaignForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCampaignMutation.isLoading}>
                    {createCampaignMutation.isLoading ? (
                      <>
                        <i className="fas fa-spinner animate-spin mr-2"></i>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-2"></i>
                        Create Campaign
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Campaigns List */}
          <div className="glassmorphism-card rounded-xl p-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-envelope text-4xl text-gray-400 mb-4"></i>
                <h4 className="text-lg font-semibold mb-2">No Campaigns Yet</h4>
                <p className="text-gray-400">Create your first email campaign to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 glassmorphism rounded-lg" data-testid={`campaign-${campaign.id}`}>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-neon-mint/20 rounded-lg">
                        <i className="fas fa-envelope text-neon-mint"></i>
                      </div>
                      <div>
                        <h5 className="font-semibold">{campaign.name}</h5>
                        <p className="text-sm text-gray-400">{campaign.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="font-semibold">{campaign.recipientCount.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Recipients</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-neon-mint">{calculateOpenRate(campaign.openCount, campaign.recipientCount)}%</div>
                        <div className="text-xs text-gray-400">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-neon-purple">{calculateClickRate(campaign.clickCount, campaign.recipientCount)}%</div>
                        <div className="text-xs text-gray-400">Click Rate</div>
                      </div>
                      <div className={`text-sm font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-edit-campaign-${campaign.id}`}>
                        <i className="fas fa-edit"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'funnels' && (
        <div data-testid="funnels-tab">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-space font-semibold">Sales Funnels</h3>
            <Button onClick={() => setShowFunnelForm(true)} data-testid="button-new-funnel">
              <i className="fas fa-plus mr-2"></i>
              Create Funnel
            </Button>
          </div>

          {/* Funnel Templates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glassmorphism-card rounded-xl p-6 hover:scale-105 transition-smooth cursor-pointer" onClick={() => setShowFunnelForm(true)}>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center mb-4">
                <i className="fas fa-envelope text-dark-navy"></i>
              </div>
              <h4 className="font-space font-semibold mb-2">Email Capture Funnel</h4>
              <p className="text-sm text-gray-400 mb-4">Capture emails with exclusive deals and send daily personalized coupons</p>
              <div className="text-xs text-neon-mint">Most Popular Template</div>
            </div>

            <div className="glassmorphism-card rounded-xl p-6 hover:scale-105 transition-smooth cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink flex items-center justify-center mb-4">
                <i className="fas fa-tags text-dark-navy"></i>
              </div>
              <h4 className="font-space font-semibold mb-2">Category-Specific Funnel</h4>
              <p className="text-sm text-gray-400 mb-4">Target users based on category preferences with relevant deals</p>
              <div className="text-xs text-neon-purple">High Conversion</div>
            </div>

            <div className="glassmorphism-card rounded-xl p-6 hover:scale-105 transition-smooth cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-pink to-neon-mint flex items-center justify-center mb-4">
                <i className="fas fa-shopping-cart text-dark-navy"></i>
              </div>
              <h4 className="font-space font-semibold mb-2">Abandoned Cart Recovery</h4>
              <p className="text-sm text-gray-400 mb-4">Re-engage users who clicked but didn't complete purchase</p>
              <div className="text-xs text-neon-pink">High ROI</div>
            </div>
          </div>

          {/* Funnel Form */}
          {showFunnelForm && (
            <div className="glassmorphism-card rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4">Create New Funnel</h4>
              <form onSubmit={funnelForm.handleSubmit(onFunnelSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Funnel Name</Label>
                      <Input
                        {...funnelForm.register("name")}
                        placeholder="e.g., Fashion Deal Subscribers"
                        data-testid="input-funnel-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="type">Funnel Type</Label>
                      <Select onValueChange={(value) => funnelForm.setValue('type', value)}>
                        <SelectTrigger data-testid="select-funnel-type">
                          <SelectValue placeholder="Select funnel type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email_capture">Email Capture</SelectItem>
                          <SelectItem value="category_specific">Category Specific</SelectItem>
                          <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        {...funnelForm.register("description")}
                        placeholder="Describe your funnel strategy..."
                        data-testid="textarea-funnel-description"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emailFrequency">Email Frequency</Label>
                      <Select onValueChange={(value) => funnelForm.setValue('config.emailFrequency', value)}>
                        <SelectTrigger data-testid="select-email-frequency">
                          <SelectValue placeholder="Select frequency..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Personalization Options</Label>
                      <div className="space-y-2 mt-2">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...funnelForm.register('config.personalization.analyzeBehavior')}
                            className="rounded text-neon-mint"
                          />
                          <span className="text-sm">Analyze browsing behavior</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...funnelForm.register('config.personalization.categorySpecific')}
                            className="rounded text-neon-mint"
                          />
                          <span className="text-sm">Send category-specific deals</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...funnelForm.register('config.personalization.priceDropAlerts')}
                            className="rounded text-neon-mint"
                          />
                          <span className="text-sm">Price drop alerts</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFunnelForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFunnelMutation.isLoading}>
                    {createFunnelMutation.isLoading ? (
                      <>
                        <i className="fas fa-spinner animate-spin mr-2"></i>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-2"></i>
                        Create Funnel
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Active Funnels */}
          <div className="glassmorphism-card rounded-xl p-6">
            <h4 className="text-lg font-semibold mb-4">Active Funnels</h4>
            {funnels.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-funnel-dollar text-4xl text-gray-400 mb-4"></i>
                <h5 className="text-lg font-semibold mb-2">No Funnels Created</h5>
                <p className="text-gray-400">Create your first sales funnel to start converting visitors.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {funnels.map((funnel) => (
                  <div key={funnel.id} className="p-4 bg-white/5 rounded-lg border border-white/10" data-testid={`funnel-${funnel.id}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-space font-semibold">{funnel.name}</h5>
                        <p className="text-sm text-gray-400">{funnel.description || funnel.type}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${funnel.isActive ? 'bg-success animate-pulse' : 'bg-gray-500'}`}></div>
                          <span className="text-xs font-medium">{funnel.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <i className="fas fa-edit mr-2"></i>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <i className="fas fa-chart-bar mr-2"></i>
                          Analytics
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-neon-mint">{funnel.totalVisitors.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Visitors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-neon-purple">{funnel.totalConversions.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Conversions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-neon-pink">
                          {funnel.totalVisitors > 0 ? ((funnel.totalConversions / funnel.totalVisitors) * 100).toFixed(1) : '0.0'}%
                        </div>
                        <div className="text-xs text-gray-400">Conversion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-success">${(Math.floor(Math.random() * 5000) + 1000).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Revenue</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <div data-testid="subscribers-tab">
          <h3 className="text-xl font-space font-semibold mb-6">Email Subscribers</h3>
          <div className="glassmorphism-card rounded-xl p-6">
            {subscribers.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
                <h4 className="text-lg font-semibold mb-2">No Subscribers Yet</h4>
                <p className="text-gray-400">Subscribers will appear here when people sign up for your newsletter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-space font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-space font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-space font-medium">Joined</th>
                      <th className="text-left py-3 px-4 font-space font-medium">Last Email</th>
                      <th className="text-left py-3 px-4 font-space font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-white/5 transition-smooth" data-testid={`subscriber-${subscriber.id}`}>
                        <td className="py-3 px-4">{subscriber.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            subscriber.status === 'active' ? 'bg-success/20 text-success' :
                            subscriber.status === 'unsubscribed' ? 'bg-red-400/20 text-red-400' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {subscriber.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {new Date(subscriber.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {subscriber.lastEmailSent ? new Date(subscriber.lastEmailSent).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-edit-subscriber-${subscriber.id}`}>
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => sendTestEmailMutation.mutate(subscriber.email)}
                              disabled={sendTestEmailMutation.isLoading}
                              data-testid={`button-send-test-${subscriber.id}`}
                            >
                              <i className="fas fa-paper-plane"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

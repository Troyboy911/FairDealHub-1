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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeneratorStatus {
  isRunning: boolean;
  currentLogId: string | null;
}

interface GeneratorLog {
  id: string;
  type: string;
  source?: string;
  productsFound: number;
  productsAdded: number;
  productsUpdated: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  errors?: string[];
  metadata?: any;
}

interface GenerationResult {
  logId: string;
  productsFound: number;
  productsAdded: number;
  productsUpdated: number;
  couponsFound: number;
  couponsAdded: number;
  errors: string[];
  duration: number;
}

const generatorConfigSchema = z.object({
  frequency: z.string(),
  qualityThreshold: z.array(z.number()).length(1),
  minReviews: z.number().min(0),
  priceMin: z.number().min(0),
  priceMax: z.number().min(1),
  sources: z.object({
    googleTrends: z.boolean(),
    amazonAPI: z.boolean(),
    affiliateFeeds: z.boolean(),
  }),
});

type GeneratorConfigData = z.infer<typeof generatorConfigSchema>;

export default function AIGenerator() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery<GeneratorStatus>({
    queryKey: ["/api/admin/ai-generator/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: (failureCount, error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return false;
      }
      return failureCount < 3;
    }
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<GeneratorLog[]>({
    queryKey: ["/api/admin/ai-generator/logs"],
    retry: (failureCount, error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return false;
      }
      return failureCount < 3;
    }
  });

  const form = useForm<GeneratorConfigData>({
    resolver: zodResolver(generatorConfigSchema),
    defaultValues: {
      frequency: "4h",
      qualityThreshold: [4.0],
      minReviews: 100,
      priceMin: 10,
      priceMax: 1000,
      sources: {
        googleTrends: true,
        amazonAPI: true,
        affiliateFeeds: true,
      },
    },
  });

  const runGeneratorMutation = useMutation({
    mutationFn: async (config?: any) => {
      return await apiRequest("/api/admin/ai-generator/run", "POST", { config });
    },
    onSuccess: (data: GenerationResult) => {
      toast({
        title: "Generator Started",
        description: `AI generator is now running. Log ID: ${data.logId}`,
      });
      queryClient.invalidateQueries(["/api/admin/ai-generator/status"]);
      queryClient.invalidateQueries(["/api/admin/ai-generator/logs"]);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start AI generator",
        variant: "destructive",
      });
    },
  });

  const handleRunGenerator = () => {
    if (status?.isRunning) {
      toast({
        title: "Generator Already Running",
        description: "Please wait for the current generation to complete.",
        variant: "destructive",
      });
      return;
    }
    runGeneratorMutation.mutate();
  };

  const onConfigSubmit = (data: GeneratorConfigData) => {
    const config = {
      frequency: data.frequency,
      qualityThreshold: data.qualityThreshold[0],
      minReviews: data.minReviews,
      priceRange: { min: data.priceMin, max: data.priceMax },
      sources: data.sources,
      categories: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty']
    };

    runGeneratorMutation.mutate(config);
    setIsConfigOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-warning';
      case 'completed': return 'text-success';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return 'fas fa-spinner animate-spin';
      case 'completed': return 'fas fa-check-circle';
      case 'failed': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-clock';
    }
  };

  if (statusLoading || logsLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded mb-4 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
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

  return (
    <div className="p-8" data-testid="ai-generator-admin">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-space font-bold mb-2">
              <i className="fas fa-robot text-neon-mint mr-3"></i>
              AI Product Generator
            </h1>
            <p className="text-gray-400">Automated product discovery and categorization system</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              data-testid="button-toggle-config"
            >
              <i className="fas fa-cog mr-2"></i>
              Configure
            </Button>
            <Button
              onClick={handleRunGenerator}
              disabled={status?.isRunning || runGeneratorMutation.isLoading}
              data-testid="button-run-generator"
            >
              {status?.isRunning || runGeneratorMutation.isLoading ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Running...
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  Run Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Generator Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glassmorphism-card rounded-xl p-6" data-testid="generator-status">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success/20 rounded-lg">
              <i className="fas fa-clock text-success"></i>
            </div>
            <div className={`w-3 h-3 rounded-full ${status?.isRunning ? 'bg-success animate-pulse' : 'bg-gray-500'}`}></div>
          </div>
          <div className="text-2xl font-bold mb-1">Every 4hrs</div>
          <div className="text-sm text-gray-400">Schedule</div>
          <div className="text-xs text-neon-mint mt-2">
            {status?.isRunning ? 'Currently Running...' : 'Next run: In 2:30 hours'}
          </div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="products-metrics">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neon-mint/20 rounded-lg">
              <i className="fas fa-plus text-neon-mint"></i>
            </div>
            <span className="text-xs text-success">+12%</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {logs[0] ? (logs[0].productsAdded + logs[0].productsUpdated).toLocaleString() : '0'}
          </div>
          <div className="text-sm text-gray-400">Products Processed (24h)</div>
        </div>

        <div className="glassmorphism-card rounded-xl p-6" data-testid="generation-status">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neon-purple/20 rounded-lg">
              <i className="fas fa-sync-alt text-neon-purple"></i>
            </div>
            <span className={`text-xs ${status?.isRunning ? 'text-warning' : 'text-success'}`}>
              {status?.isRunning ? 'Processing' : 'Ready'}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {logs.filter(log => log.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-400">Successful Runs (7d)</div>
        </div>
      </div>

      {/* Configuration Panel */}
      {isConfigOpen && (
        <div className="glassmorphism-card rounded-xl p-6 mb-8" data-testid="generator-config">
          <h3 className="text-xl font-space font-semibold mb-6">Generator Configuration</h3>
          <form onSubmit={form.handleSubmit(onConfigSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="frequency">Run Frequency</Label>
                  <Select onValueChange={(value) => form.setValue('frequency', value)}>
                    <SelectTrigger data-testid="select-frequency">
                      <SelectValue placeholder="Select frequency..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2h">Every 2 hours</SelectItem>
                      <SelectItem value="4h">Every 4 hours</SelectItem>
                      <SelectItem value="6h">Every 6 hours</SelectItem>
                      <SelectItem value="12h">Every 12 hours</SelectItem>
                      <SelectItem value="24h">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="qualityThreshold">Quality Threshold: {form.watch('qualityThreshold')?.[0]?.toFixed(1)}</Label>
                  <Slider
                    value={form.watch('qualityThreshold')}
                    onValueChange={(value) => form.setValue('qualityThreshold', value)}
                    max={5}
                    min={1}
                    step={0.1}
                    className="mt-2"
                    data-testid="slider-quality-threshold"
                  />
                  <div className="text-xs text-gray-400 mt-1">Minimum product rating required</div>
                </div>

                <div>
                  <Label htmlFor="minReviews">Minimum Reviews</Label>
                  <Input
                    {...form.register("minReviews", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    data-testid="input-min-reviews"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceMin">Price Range Min ($)</Label>
                    <Input
                      {...form.register("priceMin", { valueAsNumber: true })}
                      type="number"
                      min="0"
                      data-testid="input-price-min"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceMax">Price Range Max ($)</Label>
                    <Input
                      {...form.register("priceMax", { valueAsNumber: true })}
                      type="number"
                      min="1"
                      data-testid="input-price-max"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Data Sources</Label>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-search text-neon-mint"></i>
                        <div>
                          <div className="font-medium">Google Trends API</div>
                          <div className="text-sm text-gray-400">Trending product discovery</div>
                        </div>
                      </div>
                      <Switch
                        checked={form.watch('sources.googleTrends')}
                        onCheckedChange={(checked) => form.setValue('sources.googleTrends', checked)}
                        data-testid="switch-google-trends"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                      <div className="flex items-center space-x-3">
                        <i className="fab fa-amazon text-warning"></i>
                        <div>
                          <div className="font-medium">Amazon PA-API</div>
                          <div className="text-sm text-gray-400">Product data & bestsellers</div>
                        </div>
                      </div>
                      <Switch
                        checked={form.watch('sources.amazonAPI')}
                        onCheckedChange={(checked) => form.setValue('sources.amazonAPI', checked)}
                        data-testid="switch-amazon-api"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-handshake text-neon-purple"></i>
                        <div>
                          <div className="font-medium">Affiliate Network Feeds</div>
                          <div className="text-sm text-gray-400">Deal feeds from CJ, Impact, etc.</div>
                        </div>
                      </div>
                      <Switch
                        checked={form.watch('sources.affiliateFeeds')}
                        onCheckedChange={(checked) => form.setValue('sources.affiliateFeeds', checked)}
                        data-testid="switch-affiliate-feeds"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfigOpen(false)}
                data-testid="button-cancel-config"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={runGeneratorMutation.isLoading}
                data-testid="button-save-config"
              >
                {runGeneratorMutation.isLoading ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Running...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save & Run
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Generation Activity */}
      <div className="glassmorphism-card rounded-xl p-6">
        <h4 className="text-xl font-space font-semibold mb-6">Recent Activity</h4>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-history text-4xl text-gray-400 mb-4"></i>
            <h5 className="text-lg font-semibold mb-2">No Activity Yet</h5>
            <p className="text-gray-400">Run the generator to see activity logs here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center space-x-4 p-4 glassmorphism rounded-lg" data-testid={`log-${log.id}`}>
                <div className={`p-2 rounded-lg ${log.status === 'completed' ? 'bg-success/20' : log.status === 'failed' ? 'bg-red-400/20' : 'bg-warning/20'}`}>
                  <i className={`${getStatusIcon(log.status)} ${getStatusColor(log.status)}`}></i>
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {log.status === 'completed' ? 
                      `Generated ${log.productsAdded} new products, updated ${log.productsUpdated}` :
                      log.status === 'failed' ?
                      `Generation failed - ${log.errors?.[0] || 'Unknown error'}` :
                      'Generation in progress...'
                    }
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(log.startedAt).toLocaleString()}
                    {log.source && ` • Source: ${log.source}`}
                    {log.completedAt && ` • Duration: ${Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s`}
                  </div>
                </div>
                <Button variant="outline" size="sm" data-testid={`button-view-log-${log.id}`}>
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

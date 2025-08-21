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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AffiliateNetwork {
  id: string;
  name: string;
  slug: string;
  status: string;
  lastSyncAt?: string;
  commissionRate?: string;
}

const newNetworkSchema = z.object({
  name: z.string().min(1, "Network name is required"),
  slug: z.string().min(1, "Slug is required"),
  apiEndpoint: z.string().url("Valid API endpoint required"),
  apiKey: z.string().min(1, "API key is required"),
  programId: z.string().min(1, "Program ID is required"),
  commissionRate: z.string().optional(),
});

type NewNetworkData = z.infer<typeof newNetworkSchema>;

export default function AffiliateNetworks() {
  const [testingNetwork, setTestingNetwork] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: networks = [], isLoading } = useQuery<AffiliateNetwork[]>({
    queryKey: ["/api/admin/affiliate-networks"],
  });

  const form = useForm<NewNetworkData>({
    resolver: zodResolver(newNetworkSchema),
    defaultValues: {
      name: "",
      slug: "",
      apiEndpoint: "",
      apiKey: "",
      programId: "",
      commissionRate: "",
    },
  });

  const createNetworkMutation = useMutation({
    mutationFn: async (data: NewNetworkData) => {
      return await apiRequest("POST", "/api/admin/affiliate-networks", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Affiliate network added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliate-networks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add affiliate network",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (networkId: string) => {
      return await apiRequest("POST", `/api/admin/affiliate-networks/${networkId}/test`, {});
    },
    onSuccess: (data: any, networkId: string) => {
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      setTestingNetwork(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliate-networks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
      setTestingNetwork(null);
    },
  });

  const handleTestConnection = (networkId: string) => {
    setTestingNetwork(networkId);
    testConnectionMutation.mutate(networkId);
  };

  const onSubmit = (data: NewNetworkData) => {
    createNetworkMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-warning';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded mb-4 w-64"></div>
          <div className="space-y-4">
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
    <div className="p-8" data-testid="affiliate-networks-admin">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-space font-bold mb-2">Affiliate Networks</h1>
            <p className="text-gray-400">Manage your affiliate network connections and API integrations</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries(["/api/admin/affiliate-networks"])}
              data-testid="button-refresh-networks"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Network Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glassmorphism-card rounded-xl p-6 text-center">
          <div className="text-3xl font-space font-bold text-neon-mint">
            {networks.filter(n => n.status === 'active').length}
          </div>
          <p className="text-gray-400">Connected Networks</p>
        </div>
        <div className="glassmorphism-card rounded-xl p-6 text-center">
          <div className="text-3xl font-space font-bold text-neon-purple">
            {networks.filter(n => n.status === 'pending').length}
          </div>
          <p className="text-gray-400">Pending Networks</p>
        </div>
        <div className="glassmorphism-card rounded-xl p-6 text-center">
          <div className="text-3xl font-space font-bold text-neon-pink">
            {networks.length}
          </div>
          <p className="text-gray-400">Total Networks</p>
        </div>
      </div>

      {/* Active Networks List */}
      <div className="glassmorphism-card rounded-xl p-6 mb-8">
        <h3 className="text-xl font-space font-semibold mb-6">Network Connections</h3>
        
        {networks.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-network-wired text-4xl text-gray-400 mb-4"></i>
            <h4 className="text-lg font-semibold mb-2">No Networks Connected</h4>
            <p className="text-gray-400">Add your first affiliate network to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {networks.map((network) => (
              <div key={network.id} className="p-4 bg-white/5 rounded-lg border border-white/10" data-testid={`network-${network.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center">
                      <i className="fas fa-handshake text-dark-navy"></i>
                    </div>
                    <div>
                      <h4 className="font-space font-semibold">{network.name}</h4>
                      <p className="text-sm text-gray-400">Network ID: {network.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(network.status)}`}></div>
                      <span className="text-xs font-medium">{getStatusText(network.status)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(network.id)}
                      disabled={testingNetwork === network.id}
                      data-testid={`button-test-${network.id}`}
                    >
                      {testingNetwork === network.id ? (
                        <>
                          <i className="fas fa-spinner animate-spin mr-2"></i>
                          Testing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plug mr-2"></i>
                          Test Connection
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-configure-${network.id}`}>
                      <i className="fas fa-cog mr-2"></i>
                      Configure
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Commission Rate:</span>
                    <span className="text-white font-medium ml-1">{network.commissionRate || 'N/A'}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="text-neon-mint font-medium ml-1">{getStatusText(network.status)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Sync:</span>
                    <span className="text-white font-medium ml-1">
                      {network.lastSyncAt ? new Date(network.lastSyncAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Network Form */}
      <div className="glassmorphism-card rounded-xl p-6">
        <h4 className="text-xl font-space font-semibold mb-6">Add New Affiliate Network</h4>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Network Name</Label>
              <Select onValueChange={(value) => {
                form.setValue('name', value);
                form.setValue('slug', value.toLowerCase().replace(/\s+/g, '-'));
              }}>
                <SelectTrigger data-testid="select-network-name">
                  <SelectValue placeholder="Select a network..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commission Junction">Commission Junction</SelectItem>
                  <SelectItem value="Impact.com">Impact.com</SelectItem>
                  <SelectItem value="ShareASale">ShareASale</SelectItem>
                  <SelectItem value="Rakuten Advertising">Rakuten Advertising</SelectItem>
                  <SelectItem value="Partnerize">Partnerize</SelectItem>
                  <SelectItem value="FlexOffers">FlexOffers</SelectItem>
                  <SelectItem value="AvantLink">AvantLink</SelectItem>
                  <SelectItem value="Admitad">Admitad</SelectItem>
                  <SelectItem value="Tradedoubler">Tradedoubler</SelectItem>
                  <SelectItem value="Custom Network">Custom Network</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="apiEndpoint">API Endpoint</Label>
              <Input
                {...form.register("apiEndpoint")}
                placeholder="https://api.network.com/v1/"
                data-testid="input-api-endpoint"
              />
              {form.formState.errors.apiEndpoint && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.apiEndpoint.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="apiKey">API Key/Token</Label>
              <Input
                {...form.register("apiKey")}
                type="password"
                placeholder="Enter API credentials"
                data-testid="input-api-key"
              />
              {form.formState.errors.apiKey && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.apiKey.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="programId">Program/Publisher ID</Label>
              <Input
                {...form.register("programId")}
                placeholder="Your publisher/affiliate ID"
                data-testid="input-program-id"
              />
              {form.formState.errors.programId && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.programId.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                {...form.register("commissionRate")}
                type="number"
                step="0.1"
                placeholder="e.g., 5.5"
                data-testid="input-commission-rate"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              data-testid="button-cancel-network"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createNetworkMutation.isPending}
              data-testid="button-add-network"
            >
              {createNetworkMutation.isPending ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Adding...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Add Network
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

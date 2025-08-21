import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Coupon {
  id: string;
  merchantId: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumSpend: number;
  expiresAt: string;
  isActive: boolean;
  isVerified: boolean;
  usageCount: number;
  maxUsage: number;
  createdAt: string;
}

interface Merchant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
}

const couponSchema = z.object({
  merchantId: z.string().min(1, "Merchant is required"),
  code: z.string().min(1, "Coupon code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.string().min(1, "Discount value is required"),
  minimumSpend: z.string().optional(),
  expiresAt: z.string().min(1, "Expiry date is required"),
  maxUsage: z.string().optional(),
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function CouponManagement() {
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading: couponsLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const { data: merchants = [] } = useQuery<Merchant[]>({
    queryKey: ["/api/admin/merchants"],
  });

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      merchantId: "",
      code: "",
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minimumSpend: "0",
      expiresAt: "",
      maxUsage: "1000",
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const couponData = {
        ...data,
        discountValue: parseFloat(data.discountValue),
        minimumSpend: parseFloat(data.minimumSpend || "0"),
        maxUsage: parseInt(data.maxUsage || "1000"),
        expiresAt: new Date(data.expiresAt).toISOString(),
      };
      return await apiRequest("POST", "/api/admin/coupons", couponData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coupon added successfully",
      });
      form.reset();
      setIsAddingCoupon(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add coupon",
        variant: "destructive",
      });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CouponFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/coupons/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      });
      setEditingCoupon(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update coupon",
        variant: "destructive",
      });
    },
  });

  const verifyCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      return await apiRequest("POST", `/api/admin/coupons/${couponId}/verify`, {});
    },
    onSuccess: (data: any, couponId: string) => {
      toast({
        title: data.success ? "Verification Successful" : "Verification Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      setVerifyingCoupon(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify coupon",
        variant: "destructive",
      });
      setVerifyingCoupon(null);
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/coupons/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CouponFormData) => {
    if (editingCoupon) {
      updateCouponMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createCouponMutation.mutate(data);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.reset({
      merchantId: coupon.merchantId,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minimumSpend: coupon.minimumSpend.toString(),
      expiresAt: new Date(coupon.expiresAt).toISOString().split('T')[0],
      maxUsage: coupon.maxUsage.toString(),
    });
    setIsAddingCoupon(true);
  };

  const handleVerify = (couponId: string) => {
    setVerifyingCoupon(couponId);
    verifyCouponMutation.mutate(couponId);
  };

  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    form.setValue("code", result);
  };

  if (couponsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-mint to-neon-purple animate-spin flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-dark-navy"></div>
          </div>
          <p className="text-white font-space">Loading Coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-space font-bold text-white">Coupon Management</h2>
          <p className="text-gray-400 mt-1">Manage and verify coupon codes</p>
        </div>
        <Dialog open={isAddingCoupon} onOpenChange={setIsAddingCoupon}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy hover:scale-105 transition-smooth"
              data-testid="button-add-coupon"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-dark-navy border border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-space">
                {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="merchantId" className="text-white">Merchant</Label>
                  <Select onValueChange={(value) => form.setValue("merchantId", value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select merchant" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {merchants.map((merchant) => (
                        <SelectItem key={merchant.id} value={merchant.id}>
                          {merchant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="code" className="text-white">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("code")}
                      className="bg-gray-800 border-gray-600 text-white flex-1"
                      placeholder="SAVE20"
                      data-testid="input-coupon-code"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCouponCode}
                      data-testid="button-generate-code"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  {...form.register("title")}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="20% Off Electronics"
                  data-testid="input-coupon-title"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  {...form.register("description")}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Get 20% off all electronics over $100"
                  rows={3}
                  data-testid="input-coupon-description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discountType" className="text-white">Discount Type</Label>
                  <Select onValueChange={(value) => form.setValue("discountType", value as "percentage" | "fixed")}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discountValue" className="text-white">Discount Value</Label>
                  <Input
                    {...form.register("discountValue")}
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="20"
                    data-testid="input-discount-value"
                  />
                </div>
                
                <div>
                  <Label htmlFor="minimumSpend" className="text-white">Minimum Spend ($)</Label>
                  <Input
                    {...form.register("minimumSpend")}
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="100"
                    data-testid="input-minimum-spend"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiresAt" className="text-white">Expiry Date</Label>
                  <Input
                    {...form.register("expiresAt")}
                    type="date"
                    className="bg-gray-800 border-gray-600 text-white"
                    data-testid="input-expiry-date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxUsage" className="text-white">Max Usage</Label>
                  <Input
                    {...form.register("maxUsage")}
                    type="number"
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="1000"
                    data-testid="input-max-usage"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingCoupon(false);
                    setEditingCoupon(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-coupon"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
                  className="bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy"
                  data-testid="button-save-coupon"
                >
                  {createCouponMutation.isPending || updateCouponMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner animate-spin mr-2"></i>
                      {editingCoupon ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {editingCoupon ? "Update Coupon" : "Add Coupon"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Code</TableHead>
              <TableHead className="text-gray-300">Merchant</TableHead>
              <TableHead className="text-gray-300">Discount</TableHead>
              <TableHead className="text-gray-300">Usage</TableHead>
              <TableHead className="text-gray-300">Expiry</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => {
              const merchant = merchants.find(m => m.id === coupon.merchantId);
              const isExpired = new Date(coupon.expiresAt) < new Date();
              return (
                <TableRow key={coupon.id} className="border-gray-700">
                  <TableCell>
                    <div>
                      <p className="text-white font-mono font-bold text-lg">{coupon.code}</p>
                      <p className="text-gray-400 text-sm">{coupon.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {merchant?.logoUrl && (
                        <img
                          src={merchant.logoUrl}
                          alt={merchant.name}
                          className="w-6 h-6 rounded"
                        />
                      )}
                      <span className="text-gray-300">{merchant?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-white">
                      <span className="text-lg font-bold">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                      </span>
                      {coupon.minimumSpend > 0 && (
                        <p className="text-gray-400 text-sm">Min: ${coupon.minimumSpend}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-white">
                      <span>{coupon.usageCount}</span>
                      <span className="text-gray-400">/{coupon.maxUsage}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${isExpired ? 'text-red-400' : 'text-gray-300'}`}>
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        coupon.isActive
                          ? "bg-success/20 text-success"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        coupon.isVerified
                          ? "bg-neon-mint/20 text-neon-mint"
                          : "bg-warning/20 text-warning"
                      }`}>
                        {coupon.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerify(coupon.id)}
                        disabled={verifyingCoupon === coupon.id}
                        className="text-neon-mint hover:text-neon-mint"
                        data-testid={`button-verify-${coupon.id}`}
                      >
                        {verifyingCoupon === coupon.id ? (
                          <i className="fas fa-spinner animate-spin"></i>
                        ) : (
                          <i className="fas fa-check-circle"></i>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(coupon)}
                        data-testid={`button-edit-${coupon.id}`}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCouponMutation.mutate(coupon.id)}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`button-delete-${coupon.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
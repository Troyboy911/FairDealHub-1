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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  merchantId: string;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  rating: number;
  totalReviews: number;
  imageUrl: string;
  productUrl: string;
  affiliateUrl: string;
  isActive: boolean;
  aiGenerated: boolean;
  createdAt: string;
}

interface Merchant {
  id: string;
  name: string;
  slug: string;
  website: string;
  logoUrl: string;
  commissionRate: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  merchantId: z.string().min(1, "Merchant is required"),
  originalPrice: z.string().min(1, "Original price is required"),
  salePrice: z.string().min(1, "Sale price is required"),
  imageUrl: z.string().url("Valid image URL required"),
  productUrl: z.string().url("Valid product URL required"),
  affiliateUrl: z.string().url("Valid affiliate URL required"),
  rating: z.string().optional(),
  totalReviews: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductManagement() {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: merchants = [] } = useQuery<Merchant[]>({
    queryKey: ["/api/admin/merchants"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      merchantId: "",
      originalPrice: "",
      salePrice: "",
      imageUrl: "",
      productUrl: "",
      affiliateUrl: "",
      rating: "4.5",
      totalReviews: "0",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData = {
        ...data,
        originalPrice: parseFloat(data.originalPrice),
        salePrice: parseFloat(data.salePrice),
        rating: parseFloat(data.rating || "4.5"),
        totalReviews: parseInt(data.totalReviews || "0"),
        discountPercentage: Math.round(((parseFloat(data.originalPrice) - parseFloat(data.salePrice)) / parseFloat(data.originalPrice)) * 100),
      };
      return await apiRequest("POST", "/api/admin/products", productData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      form.reset();
      setIsAddingProduct(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/products/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/products/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      merchantId: product.merchantId,
      originalPrice: product.originalPrice.toString(),
      salePrice: product.salePrice.toString(),
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      affiliateUrl: product.affiliateUrl,
      rating: product.rating.toString(),
      totalReviews: product.totalReviews.toString(),
    });
    setIsAddingProduct(true);
  };

  const generateAffiliateLink = (productUrl: string, merchantId: string) => {
    const merchant = merchants.find(m => m.id === merchantId);
    if (!merchant) return productUrl;
    
    // Generate affiliate link based on merchant
    const baseUrl = productUrl.split('?')[0];
    return `${baseUrl}?tag=fairdeal-${merchant.slug}&ref=fairdeal`;
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-mint to-neon-purple animate-spin flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-dark-navy"></div>
          </div>
          <p className="text-white font-space">Loading Products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-space font-bold text-white">Product Management</h2>
          <p className="text-gray-400 mt-1">Manage your product catalog and affiliate links</p>
        </div>
        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy hover:scale-105 transition-smooth"
              data-testid="button-add-product"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-dark-navy border border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-space">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Product Name</Label>
                  <Input
                    {...form.register("name")}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="e.g., iPhone 15 Pro"
                    data-testid="input-product-name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
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
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  {...form.register("description")}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Product description..."
                  rows={3}
                  data-testid="input-product-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="originalPrice" className="text-white">Original Price ($)</Label>
                  <Input
                    {...form.register("originalPrice")}
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="999.99"
                    data-testid="input-original-price"
                  />
                </div>
                
                <div>
                  <Label htmlFor="salePrice" className="text-white">Sale Price ($)</Label>
                  <Input
                    {...form.register("salePrice")}
                    type="number"
                    step="0.01"
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="899.99"
                    data-testid="input-sale-price"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl" className="text-white">Image URL</Label>
                <Input
                  {...form.register("imageUrl")}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="https://images.example.com/product.jpg"
                  data-testid="input-image-url"
                />
              </div>

              <div>
                <Label htmlFor="productUrl" className="text-white">Product URL</Label>
                <Input
                  {...form.register("productUrl")}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="https://merchant.com/product"
                  data-testid="input-product-url"
                />
              </div>

              <div>
                <Label htmlFor="affiliateUrl" className="text-white">Affiliate URL</Label>
                <div className="flex gap-2">
                  <Input
                    {...form.register("affiliateUrl")}
                    className="bg-gray-800 border-gray-600 text-white flex-1"
                    placeholder="https://merchant.com/product?tag=affiliate"
                    data-testid="input-affiliate-url"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const productUrl = form.getValues("productUrl");
                      const merchantId = form.getValues("merchantId");
                      if (productUrl && merchantId) {
                        const affiliateUrl = generateAffiliateLink(productUrl, merchantId);
                        form.setValue("affiliateUrl", affiliateUrl);
                      }
                    }}
                    data-testid="button-generate-affiliate"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rating" className="text-white">Rating (1-5)</Label>
                  <Input
                    {...form.register("rating")}
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="4.5"
                    data-testid="input-rating"
                  />
                </div>
                
                <div>
                  <Label htmlFor="totalReviews" className="text-white">Total Reviews</Label>
                  <Input
                    {...form.register("totalReviews")}
                    type="number"
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="125"
                    data-testid="input-total-reviews"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-product"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy"
                  data-testid="button-save-product"
                >
                  {createProductMutation.isPending || updateProductMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner animate-spin mr-2"></i>
                      {editingProduct ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {editingProduct ? "Update Product" : "Add Product"}
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
              <TableHead className="text-gray-300">Product</TableHead>
              <TableHead className="text-gray-300">Merchant</TableHead>
              <TableHead className="text-gray-300">Price</TableHead>
              <TableHead className="text-gray-300">Discount</TableHead>
              <TableHead className="text-gray-300">Rating</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const merchant = merchants.find(m => m.id === product.merchantId);
              return (
                <TableRow key={product.id} className="border-gray-700">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-gray-400 text-sm">{product.slug}</p>
                      </div>
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
                      <span className="text-lg font-bold">${product.salePrice}</span>
                      <span className="text-gray-400 line-through ml-2">${product.originalPrice}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-neon-mint/20 text-neon-mint rounded-full text-sm">
                      {product.discountPercentage}% OFF
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className="text-warning">★</span>
                      <span className="text-white">{product.rating}</span>
                      <span className="text-gray-400">({product.totalReviews})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      product.isActive
                        ? "bg-success/20 text-success"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`button-delete-${product.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(product.affiliateUrl, '_blank')}
                        data-testid={`button-view-${product.id}`}
                      >
                        <i className="fas fa-external-link-alt"></i>
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
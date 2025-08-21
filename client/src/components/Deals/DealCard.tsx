import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description?: string;
  merchantId: string;
  originalPrice?: string;
  salePrice?: string;
  discountPercentage?: number;
  rating?: string;
  totalReviews?: number;
  imageUrl?: string;
  productUrl?: string;
  affiliateUrl?: string;
  sku?: string;
  metadata?: any;
}

interface DealCardProps {
  product: Product;
  className?: string;
}

export default function DealCard({ product, className = "" }: DealCardProps) {
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const trackClickoutMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/track/clickout", data);
    },
    onSuccess: () => {
      // Tracking successful
    },
    onError: (error) => {
      console.error('Failed to track clickout:', error);
    }
  });

  const handleCopyCoupon = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);
      toast({
        title: "Copied!",
        description: `Coupon code ${couponCode} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleGetDeal = () => {
    // Track the clickout
    trackClickoutMutation.mutate({
      productId: product.id,
      merchantId: product.merchantId,
      sessionId: Math.random().toString(36).substring(7),
      sourceUrl: window.location.href,
      targetUrl: product.affiliateUrl || product.productUrl || '#'
    });

    // Open deal in new tab
    const url = product.affiliateUrl || product.productUrl;
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Deal Link Unavailable",
        description: "This deal link is currently unavailable.",
        variant: "destructive",
      });
    }
  };

  const discountPercent = product.discountPercentage || 
    (product.originalPrice && product.salePrice ? 
      Math.round(((parseFloat(product.originalPrice) - parseFloat(product.salePrice)) / parseFloat(product.originalPrice)) * 100) : 
      0);

  // Generate mock coupon code if not available
  const mockCouponCode = `SAVE${discountPercent}`;
  
  return (
    <div className={`deal-card rounded-xl p-6 group hover:scale-[1.02] transition-smooth ${className}`} data-testid={`deal-card-${product.id}`}>
      <div className="relative mb-4">
        {/* Product Image */}
        <div className="w-full h-48 bg-white/5 rounded-lg overflow-hidden">
          {product.imageUrl && !imageError ? (
            <img 
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
              <i className="fas fa-image text-4xl text-white/20"></i>
            </div>
          )}
        </div>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-success to-neon-mint text-dark-navy rounded-full text-sm font-bold">
            {discountPercent}% OFF
          </div>
        )}

        {/* AI/Verified Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 glassmorphism rounded-full text-xs">
          <i className="fas fa-robot text-neon-mint mr-1"></i>AI Pick
        </div>

        {/* Favorite Button */}
        <button 
          className="absolute bottom-3 right-3 p-2 glassmorphism rounded-full hover:bg-white/20 transition-smooth opacity-0 group-hover:opacity-100"
          data-testid={`button-favorite-${product.id}`}
        >
          <i className="fas fa-heart text-neon-pink"></i>
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Merchant Info */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center">
            <i className="fas fa-store text-xs" style={{color: '#0B0F1A'}}></i>
          </div>
          <span className="text-sm text-gray-400">Merchant Store</span>
          <div className="w-2 h-2 rounded-full bg-success ml-auto" title="Verified Deal"></div>
        </div>
        
        {/* Product Title */}
        <h3 className="font-space font-semibold text-lg leading-tight" data-testid={`product-title-${product.id}`}>
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold text-neon-mint" data-testid={`sale-price-${product.id}`}>
            ${product.salePrice || '99.99'}
          </span>
          {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.salePrice || '0') && (
            <span className="text-lg text-gray-400 line-through" data-testid={`original-price-${product.id}`}>
              ${product.originalPrice}
            </span>
          )}
        </div>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="flex items-center">
              <i className="fas fa-star text-warning mr-1"></i>
              <span data-testid={`rating-${product.id}`}>{product.rating}</span>
            </div>
            <span>•</span>
            <span data-testid={`reviews-${product.id}`}>
              {product.totalReviews ? `${product.totalReviews.toLocaleString()} reviews` : 'No reviews'}
            </span>
          </div>
        )}
        
        {/* Coupon Code Section */}
        <div className="pt-4 space-y-3">
          <div className="glassmorphism rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Coupon Code</span>
              <span className="text-xs text-neon-mint">Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <code 
                className="flex-1 bg-dark-navy/50 px-3 py-2 rounded text-neon-mint font-mono text-sm"
                data-testid={`coupon-code-${product.id}`}
              >
                {mockCouponCode}
              </code>
              <button 
                className="px-4 py-2 bg-neon-mint text-dark-navy rounded font-medium hover:scale-105 transition-smooth"
                onClick={() => handleCopyCoupon(mockCouponCode)}
                data-testid={`button-copy-coupon-${product.id}`}
              >
                Copy
              </button>
            </div>
          </div>
          
          {/* Get Deal Button */}
          <button 
            className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-smooth"
            onClick={handleGetDeal}
            data-testid={`button-get-deal-${product.id}`}
          >
            <i className="fas fa-external-link-alt mr-2"></i>
            Get This Deal
          </button>
        </div>
        
        {/* Deal Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            🔥 <span className="text-warning">{Math.floor(Math.random() * 1000) + 100}</span> people used today
          </span>
          <span>
            ⏰ Expires in <span className="text-neon-pink">{Math.floor(Math.random() * 7) + 1} days</span>
          </span>
        </div>
      </div>
    </div>
  );
}

import DealCard from "./DealCard";

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

interface DealsGridProps {
  products: Product[];
  className?: string;
}

export default function DealsGrid({ products, className = "" }: DealsGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`} data-testid="deals-grid-empty">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-mint/20 to-neon-purple/20 flex items-center justify-center">
          <i className="fas fa-search text-2xl text-gray-400"></i>
        </div>
        <h3 className="text-xl font-space font-semibold mb-2">No Deals Found</h3>
        <p className="text-gray-400 mb-6">
          We're constantly adding new deals. Check back soon or try different filters.
        </p>
        <button 
          className="px-6 py-3 bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy rounded-lg font-semibold hover:scale-105 transition-smooth"
          onClick={() => window.location.reload()}
          data-testid="button-refresh-deals"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh Deals
        </button>
      </div>
    );
  }

  return (
    <div className={`product-grid ${className}`} data-testid="deals-grid">
      {products.map((product) => (
        <DealCard 
          key={product.id} 
          product={product}
        />
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import DealsGrid from "@/components/Deals/DealsGrid";
import NewsletterSignup from "@/components/Forms/NewsletterSignup";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Product } from "@shared/schema";

interface Stats {
  totalDeals: number;
  totalSavings: string;
  happyUsers: string;
  avgSavings: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch featured products
  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/featured", { limit: 9 }],
  });

  // Mock stats (in production these would come from analytics API)
  const stats: Stats = {
    totalDeals: 12847,
    totalSavings: "$2.4M",
    happyUsers: "125K+",
    avgSavings: "73%"
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/fairdealhub-hero-bg.jpg" 
            alt="FairDealHub Hero Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/10 via-transparent to-cyber-cyan/10"></div>
          <div className="absolute top-20 left-20 w-32 h-32 bg-electric-blue/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyber-cyan/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            {/* Hero Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative w-80 h-64 mx-auto">
                <img 
                  src="/fairdealhub-logo.jpg" 
                  alt="FairDealHub - AI-Powered Deals" 
                  className="w-full h-full object-cover rounded-2xl shadow-2xl animate-float"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-electric-blue/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
            <div className="inline-flex items-center space-x-2 glassmorphism rounded-full px-6 py-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-sm text-gray-300">
                Live: <span className="text-neon-mint font-medium">47 new deals</span> added today
              </span>
            </div>

            <h1 className="text-4xl md:text-7xl font-space font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-electric-blue to-cyber-cyan bg-clip-text text-transparent">Smart Deals</span>
              <br />Powered by <span className="text-neon-purple">AI</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get personalized coupon codes delivered daily. Our AI analyzes your preferences 
              and finds the best deals from <span className="text-cyber-cyan font-semibold">500+ top brands</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button 
                className="px-10 py-4 bg-gradient-to-r from-electric-blue to-cyber-cyan text-dark-navy rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-smooth animate-glow"
                onClick={() => document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-browse-deals"
              >
                <i className="fas fa-sparkles mr-2"></i>
                Start Saving Now
              </button>
              <button 
                className="px-10 py-4 glassmorphism text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-smooth"
                data-testid="button-how-it-works"
              >
                <i className="fas fa-play mr-2"></i>
                How It Works
              </button>
            </div>

            {/* Live Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-neon-mint mb-2" data-testid="text-total-deals">
                  {stats.totalDeals.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Active Deals</div>
                <div className="text-xs text-success mt-1">↑ 234 today</div>
              </div>
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-neon-purple mb-2" data-testid="text-total-savings">
                  {stats.totalSavings}
                </div>
                <div className="text-sm text-gray-400">User Savings</div>
                <div className="text-xs text-success mt-1">↑ $12.5K today</div>
              </div>
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-neon-pink mb-2" data-testid="text-happy-users">
                  {stats.happyUsers}
                </div>
                <div className="text-sm text-gray-400">Happy Users</div>
                <div className="text-xs text-success mt-1">↑ 1.2K today</div>
              </div>
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-warning mb-2" data-testid="text-avg-savings">
                  {stats.avgSavings}
                </div>
                <div className="text-sm text-gray-400">Avg. Savings</div>
                <div className="text-xs text-success mt-1">↑ 2% today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16" data-testid="section-categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-space font-bold mb-4">Popular Categories</h2>
            <p className="text-gray-300">Find deals in your favorite shopping categories</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div 
                key={category.id}
                className="glassmorphism rounded-xl p-6 text-center hover:bg-white/10 transition-smooth cursor-pointer group"
                data-testid={`card-category-${category.id}`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center group-hover:scale-110 transition-smooth">
                  <i className={category.icon || "fas fa-tag"} style={{color: '#0B0F1A'}}></i>
                </div>
                <h3 className="font-space font-medium text-sm">{category.name}</h3>
                <p className="text-xs text-gray-400 mt-1">View deals</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deals Section */}
      <section id="deals-section" className="py-20 bg-gradient-to-r from-transparent via-neon-mint/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-8">
            <div className="flex-1">
              <h2 className="text-4xl font-space font-bold mb-4">
                <i className="fas fa-robot text-electric-blue mr-3"></i>
                AI-Curated Deals
              </h2>
              <p className="text-gray-300">Personalized recommendations based on trending products and your interests</p>
            </div>
            <div className="w-64 h-48 relative">
              <img 
                src="/fairdealhub-logo.jpg" 
                alt="FairDealHub AI Technology" 
                className="w-full h-full object-cover rounded-xl shadow-lg animate-pulse-glow"
              />
            </div>
          </div>

          <DealsGrid products={featuredProducts || []} />
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSignup />

      <Footer />
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import DealsGrid from "@/components/Deals/DealsGrid";
import NewsletterSignup from "@/components/Forms/NewsletterSignup";
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

export default function Landing() {
  // Fetch public data (categories and featured products)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false
  });

  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/featured", { limit: 6 }],
    retry: false
  });

  // Mock stats for landing page
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
          <div className="absolute inset-0 bg-gradient-to-r from-neon-mint/10 via-transparent to-neon-purple/10"></div>
          <div className="absolute top-20 left-20 w-32 h-32 bg-neon-mint/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-neon-purple/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 glassmorphism rounded-full px-6 py-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-sm text-gray-300">
                Live: <span className="text-neon-mint font-medium">47 new deals</span> added today
              </span>
            </div>

            <h1 className="text-4xl md:text-7xl font-space font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-neon-mint to-neon-purple bg-clip-text text-transparent">Smart Deals</span>
              <br />Powered by <span className="text-neon-pink">AI</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get personalized coupon codes delivered daily. Our AI analyzes your preferences 
              and finds the best deals from <span className="text-neon-mint font-semibold">500+ top brands</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button 
                onClick={() => window.location.href = "/api/login"}
                className="px-10 py-4 bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-smooth animate-glow"
                data-testid="button-get-started"
              >
                <i className="fas fa-sparkles mr-2"></i>
                Get Started Free
              </button>
              <button 
                className="px-10 py-4 glassmorphism text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-smooth"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-learn-more"
              >
                <i className="fas fa-play mr-2"></i>
                Learn More
              </button>
            </div>

            {/* Live Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-neon-mint mb-2" data-testid="stat-total-deals">
                  {stats.totalDeals.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Active Deals</div>
                <div className="text-xs text-success mt-1">↑ 234 today</div>
              </div>
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-neon-purple mb-2" data-testid="stat-total-savings">
                  {stats.totalSavings}
                </div>
                <div className="text-sm text-gray-400">User Savings</div>
                <div className="text-xs text-success mt-1">↑ $12.5K today</div>
              </div>
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-neon-pink mb-2" data-testid="stat-happy-users">
                  {stats.happyUsers}
                </div>
                <div className="text-sm text-gray-400">Happy Users</div>
                <div className="text-xs text-success mt-1">↑ 1.2K today</div>
              </div>
              <div className="glassmorphism-card rounded-xl p-6 text-center hover:scale-105 transition-smooth">
                <div className="text-3xl font-space font-bold text-warning mb-2" data-testid="stat-avg-savings">
                  {stats.avgSavings}
                </div>
                <div className="text-sm text-gray-400">Avg. Savings</div>
                <div className="text-xs text-success mt-1">↑ 2% today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-space font-bold mb-4">How FairDealHub Works</h2>
            <p className="text-xl text-gray-300">Three simple steps to start saving big</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center">
                <span className="text-3xl font-bold text-dark-navy">1</span>
              </div>
              <h3 className="text-xl font-space font-semibold mb-4">Sign Up Free</h3>
              <p className="text-gray-400">
                Create your account and tell us your shopping preferences. 
                Our AI will learn what deals matter most to you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink flex items-center justify-center">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-space font-semibold mb-4">Get Personalized Deals</h3>
              <p className="text-gray-400">
                Receive daily emails with hand-picked deals and verified coupon codes 
                tailored specifically to your interests.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-pink to-neon-mint flex items-center justify-center">
                <span className="text-3xl font-bold text-dark-navy">3</span>
              </div>
              <h3 className="text-xl font-space font-semibold mb-4">Save Big Money</h3>
              <p className="text-gray-400">
                Click through to exclusive deals and use verified coupon codes 
                to save up to 70% on your favorite products.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-space font-bold mb-4">Popular Categories</h2>
            <p className="text-gray-300">Find deals in your favorite shopping categories</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <div 
                key={category.id}
                className="glassmorphism rounded-xl p-6 text-center hover:bg-white/10 transition-smooth cursor-pointer group"
                data-testid={`category-preview-${category.slug}`}
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

      {/* Featured Deals Preview */}
      <section className="py-20 bg-gradient-to-r from-transparent via-neon-mint/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-space font-bold mb-4">
              <i className="fas fa-fire text-warning mr-3"></i>
              Hot Deals Today
            </h2>
            <p className="text-gray-300">AI-curated deals expiring soon</p>
          </div>

          <DealsGrid products={featuredProducts} />

          <div className="text-center mt-12">
            <button 
              onClick={() => window.location.href = "/api/login"}
              className="px-8 py-4 bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy rounded-xl font-semibold hover:scale-105 transition-smooth"
              data-testid="button-view-all-deals"
            >
              <i className="fas fa-sparkles mr-2"></i>
              Sign Up to View All Deals
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      <Footer />
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length > 2);
  };

  return (
    <header className="sticky top-0 z-50 glassmorphism-strong">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-electric-blue to-cyber-cyan p-1 animate-glow">
              <img 
                src="/fairdealhub-logo.jpg" 
                alt="FairDealHub Logo" 
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <h1 className="text-xl font-space font-bold">
              Fair<span className="text-cyber-cyan">Deal</span>Hub
              <span className="text-xs text-electric-blue ml-1">2.0</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="relative">
              <button 
                className="flex items-center space-x-2 text-gray-300 hover:text-neon-mint transition-smooth"
                data-testid="button-categories"
              >
                <i className="fas fa-th-large"></i>
                <span>Categories</span>
                <i className="fas fa-chevron-down text-xs"></i>
              </button>
            </div>
            <a href="#deals" className="text-gray-300 hover:text-neon-mint transition-smooth">
              Hot Deals
            </a>
            <a href="#trending" className="text-gray-300 hover:text-neon-purple transition-smooth">
              Trending
            </a>
            <a href="#brands" className="text-gray-300 hover:text-neon-pink transition-smooth">
              Brands
            </a>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 relative">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search 12,000+ deals, brands, and coupons..."
                className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-12 pr-16 text-white placeholder-gray-400 focus:outline-none focus:border-neon-mint focus:ring-2 focus:ring-neon-mint/20 transition-smooth"
                value={searchQuery}
                onChange={handleSearchInput}
                data-testid="input-search"
              />
              <i className="fas fa-search absolute left-4 top-4 text-gray-400"></i>
              <button 
                onClick={() => {
                  // AI-powered search functionality
                  if (searchQuery.trim()) {
                    setShowSearchResults(true);
                  }
                }}
                className="absolute right-2 top-2 p-2 bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy rounded-lg hover:scale-105 transition-smooth"
                data-testid="button-ai-search"
              >
                <i className="fas fa-sparkles text-sm"></i>
              </button>
            </div>
            
            {/* Search Results */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 glassmorphism-card rounded-xl shadow-2xl" data-testid="search-results">
                <div className="p-4">
                  <div className="text-xs text-neon-mint mb-2 flex items-center">
                    <i className="fas fa-robot mr-1"></i> AI Suggestions
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setSearchQuery("MacBook Pro deals");
                        setShowSearchResults(false);
                      }}
                      className="w-full flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-left"
                      data-testid="search-suggestion-macbook"
                    >
                      <i className="fas fa-laptop text-neon-purple"></i>
                      <span className="text-sm">MacBook Pro deals - Save up to $300</span>
                    </button>
                    <button 
                      onClick={() => {
                        setSearchQuery("Sony WH-1000XM5");
                        setShowSearchResults(false);
                      }}
                      className="w-full flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-left"
                      data-testid="search-suggestion-headphones"
                    >
                      <i className="fas fa-headphones text-neon-mint"></i>
                      <span className="text-sm">Sony WH-1000XM5 - 25% off</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <button 
                  onClick={() => window.location.href = "/api/login"}
                  className="hidden sm:flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-smooth animate-pulse-glow"
                  data-testid="button-login"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Sign In</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  className="p-3 glassmorphism rounded-xl hover:bg-white/10 transition-smooth relative"
                  title="Notifications"
                  data-testid="button-notifications"
                >
                  <i className="fas fa-bell text-neon-mint"></i>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full animate-pulse"></span>
                </button>
                
                <button 
                  className="p-3 glassmorphism rounded-xl hover:bg-white/10 transition-smooth"
                  title="Profile"
                  data-testid="button-profile"
                >
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <i className="fas fa-user text-neon-mint"></i>
                  )}
                </button>

                {user?.role === 'admin' && (
                  <button 
                    onClick={() => window.location.href = '/admin'}
                    className="p-3 glassmorphism rounded-xl hover:bg-white/10 transition-smooth"
                    title="Admin Panel"
                    data-testid="button-admin"
                  >
                    <i className="fas fa-cog text-neon-purple"></i>
                  </button>
                )}
              </>
            )}

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 glassmorphism rounded-xl hover:bg-white/10 transition-smooth"
              data-testid="button-mobile-menu"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10" data-testid="mobile-menu">
            <div className="space-y-2">
              <a href="#deals" className="block px-4 py-2 text-gray-300 hover:text-neon-mint transition-smooth">
                Hot Deals
              </a>
              <a href="#trending" className="block px-4 py-2 text-gray-300 hover:text-neon-purple transition-smooth">
                Trending
              </a>
              <a href="#brands" className="block px-4 py-2 text-gray-300 hover:text-neon-pink transition-smooth">
                Brands
              </a>
              <a href="#categories" className="block px-4 py-2 text-gray-300 hover:text-neon-mint transition-smooth">
                Categories
              </a>
              {!isAuthenticated && (
                <button 
                  onClick={() => window.location.href = "/api/login"}
                  className="block w-full text-left px-4 py-2 text-neon-mint hover:bg-white/5 transition-smooth"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

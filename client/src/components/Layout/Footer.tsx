export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-navy/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-neon-mint to-neon-purple flex items-center justify-center">
                <i className="fas fa-bolt text-dark-navy text-lg"></i>
              </div>
              <h3 className="text-xl font-space font-bold">
                Fair<span className="text-neon-mint">Deal</span>Hub 2.0
              </h3>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The future of smart shopping. AI-powered deals, personalized recommendations, 
              and verified coupon codes from 500+ top brands.
            </p>
            <div className="flex space-x-4">
              <button className="p-3 glassmorphism rounded-lg hover:bg-white/10 transition-smooth" data-testid="social-twitter">
                <i className="fab fa-twitter text-neon-mint"></i>
              </button>
              <button className="p-3 glassmorphism rounded-lg hover:bg-white/10 transition-smooth" data-testid="social-facebook">
                <i className="fab fa-facebook text-neon-purple"></i>
              </button>
              <button className="p-3 glassmorphism rounded-lg hover:bg-white/10 transition-smooth" data-testid="social-instagram">
                <i className="fab fa-instagram text-neon-pink"></i>
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-space font-semibold mb-4">Quick Links</h4>
            <div className="space-y-3">
              <a href="#deals" className="block text-gray-400 hover:text-neon-mint transition-smooth" data-testid="link-deals">
                Today's Deals
              </a>
              <a href="#categories" className="block text-gray-400 hover:text-neon-mint transition-smooth" data-testid="link-categories">
                Categories
              </a>
              <a href="#brands" className="block text-gray-400 hover:text-neon-mint transition-smooth" data-testid="link-brands">
                Top Brands
              </a>
              <a href="#about" className="block text-gray-400 hover:text-neon-mint transition-smooth" data-testid="link-about">
                About Us
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-space font-semibold mb-4">Support</h4>
            <div className="space-y-3">
              <a href="#help" className="block text-gray-400 hover:text-neon-mint transition-smooth" data-testid="link-help">
                Help Center
              </a>
              <a href="#contact" className="block text-gray-400 hover:text-neon-mint transition-smooth" data-testid="link-contact">
                Contact Us
              </a>
              <a href="#privacy" className="block text-gray-400 hover:text-neon-mint transition-smooth" data-testid="link-privacy">
                Privacy Policy
              </a>
              <a 
                href="https://stellarcdynamics.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-gray-400 hover:text-neon-purple transition-smooth"
                data-testid="link-stellar-dynamics"
              >
                <i className="fas fa-external-link-alt mr-1"></i>
                Stellar Dynamics
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 FairDealHub. All rights reserved. Powered by AI.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#terms" className="text-gray-400 hover:text-neon-mint text-sm transition-smooth" data-testid="link-terms">
              Terms
            </a>
            <a href="#privacy" className="text-gray-400 hover:text-neon-mint text-sm transition-smooth" data-testid="link-privacy-footer">
              Privacy
            </a>
            <a href="#cookies" className="text-gray-400 hover:text-neon-mint text-sm transition-smooth" data-testid="link-cookies">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

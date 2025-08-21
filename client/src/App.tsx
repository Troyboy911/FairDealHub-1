import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import AdminPanel from "@/pages/AdminPanel";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-navy via-dark-navy to-[#1A1B3A]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-mint to-neon-purple animate-spin flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-dark-navy"></div>
          </div>
          <p className="text-white font-space">Loading FairDealHub...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/admin" component={() => {
            window.location.href = "/api/login";
            return null;
          }} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/admin" component={() => {
            if (user?.role === 'admin') {
              return <AdminPanel />;
            } else {
              return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-navy via-dark-navy to-[#1A1B3A]">
                  <div className="text-center">
                    <h1 className="text-2xl font-space font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-gray-400 mb-6">Admin access required to view this page.</p>
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="px-6 py-3 bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy rounded-lg font-semibold hover:scale-105 transition-smooth"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              );
            }
          }} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-dark-navy via-dark-navy to-[#1A1B3A] text-white">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

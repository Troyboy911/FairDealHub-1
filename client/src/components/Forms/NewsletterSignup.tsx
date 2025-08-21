import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  preferences: z.object({
    categories: z.array(z.string()).min(1, "Please select at least one category"),
  }),
});

type SignupData = z.infer<typeof signupSchema>;

const categories = [
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'fashion', name: 'Fashion', icon: '👕' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'sports', name: 'Sports & Outdoors', icon: '⚽' },
  { id: 'beauty', name: 'Beauty & Health', icon: '💄' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'books', name: 'Books & Media', icon: '📚' },
  { id: 'automotive', name: 'Automotive', icon: '🚗' },
];

export default function NewsletterSignup() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      preferences: {
        categories: [],
      },
    },
  });

  const subscribeUserMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      return await apiRequest("/api/subscribe", "POST", {
        email: data.email,
        status: "active",
        preferences: data.preferences,
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome to FairDealHub! 🎉",
        description: "You'll receive your first personalized deals email tomorrow morning.",
      });
      form.reset();
      setSelectedCategories([]);
    },
    onError: (error: Error) => {
      if (error.message.includes('already subscribed')) {
        toast({
          title: "Already Subscribed",
          description: "This email is already receiving our daily deals.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Failed",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
    },
  });

  const toggleCategory = (categoryId: string) => {
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(updatedCategories);
    form.setValue('preferences.categories', updatedCategories);
    
    // Clear validation error when user selects categories
    if (updatedCategories.length > 0) {
      form.clearErrors('preferences.categories');
    }
  };

  const onSubmit = (data: SignupData) => {
    if (selectedCategories.length === 0) {
      form.setError('preferences.categories', {
        type: 'manual',
        message: 'Please select at least one category'
      });
      return;
    }

    const submissionData = {
      ...data,
      preferences: {
        categories: selectedCategories,
      },
    };

    subscribeUserMutation.mutate(submissionData);
  };

  return (
    <section className="py-20" data-testid="newsletter-signup">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glassmorphism-card rounded-2xl p-8 md:p-12 text-center relative overflow-hidden animate-glow">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-mint/10 to-neon-purple/10"></div>
          <div className="relative">
            <div className="inline-flex items-center space-x-2 glassmorphism rounded-full px-6 py-2 mb-6">
              <i className="fas fa-sparkles text-neon-mint"></i>
              <span className="text-sm">Join 125,000+ Smart Shoppers</span>
            </div>
            
            <h2 className="text-4xl font-space font-bold mb-6">
              Get <span className="text-neon-mint">Personalized</span> Deals Daily
            </h2>
            
            <p className="text-xl text-gray-300 mb-8">
              Our AI learns your preferences and sends you the best coupon codes 
              every morning. No spam, just savings.
            </p>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="newsletter-form">
              {/* Email Input */}
              <div className="relative max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email for daily deals"
                  className="w-full bg-white/5 border border-white/20 rounded-xl py-4 px-6 text-white placeholder-gray-400 focus:outline-none focus:border-neon-mint focus:ring-2 focus:ring-neon-mint/20 transition-smooth text-center"
                  {...form.register("email")}
                  data-testid="input-newsletter-email"
                />
                {form.formState.errors.email && (
                  <p className="text-red-400 text-sm mt-2">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              {/* Category Preferences */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose your interests:</h3>
                <div className="flex flex-wrap gap-3 justify-center" data-testid="category-preferences">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
                        selectedCategories.includes(category.id)
                          ? 'bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy scale-105'
                          : 'glassmorphism hover:bg-white/10 hover:scale-105'
                      }`}
                      data-testid={`category-${category.id}`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
                {form.formState.errors.preferences?.categories && (
                  <p className="text-red-400 text-sm mt-2 text-center">
                    {form.formState.errors.preferences.categories.message}
                  </p>
                )}
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full max-w-md mx-auto py-4 bg-gradient-to-r from-neon-mint to-neon-purple text-dark-navy rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-smooth animate-glow"
                disabled={subscribeUserMutation.isPending}
                data-testid="button-subscribe"
              >
                {subscribeUserMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Subscribing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-envelope mr-2"></i>
                    Start Getting Personalized Deals
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500">
                Free forever • Unsubscribe anytime • 98% open rate • No spam guaranteed
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

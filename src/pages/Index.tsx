import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Target, 
  Rocket, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  Brain,
  Heart,
  Sparkles,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';

interface OnboardingData {
  idea: string;
  audience: string;
  namingPreference: string;
}

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedData, setCompletedData] = useState<OnboardingData | null>(null);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (data: OnboardingData) => {
    setCompletedData(data);
    // In a real app, this would redirect to dashboard or show success
    console.log('Onboarding completed:', data);
  };

  const resetOnboarding = () => {
    setShowOnboarding(false);
    setCompletedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {/* Hero Section */}
      {!showOnboarding && !completedData && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center space-y-12">
            <div className="space-y-6 max-w-4xl mx-auto">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium animate-bounce-in">
                ✨ Turn Ideas Into Income
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in">
                Your next 
                <span className="bg-gradient-hero bg-clip-text text-transparent"> side-hustle</span> starts
                <br />
                <span className="bg-gradient-accent bg-clip-text text-transparent">right here</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up">
                Tell us your idea, we'll handle the hard part. 
                <strong className="text-foreground"> No overwhelm, no complexity</strong> — 
                just simple steps from idea to income.
              </p>

              <div className="pt-8 animate-slide-up">
                <Button 
                  variant="hero" 
                  size="xl"
                  onClick={handleStartOnboarding}
                  className="text-xl px-12 py-6 h-auto animate-pulse hover:animate-none"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Turn My Idea Into a Business
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Takes 2 minutes • See instant preview • Launch for $10
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center animate-fade-in">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">2 mins</div>
                <div className="text-sm text-muted-foreground">Setup time</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-accent">$10</div>
                <div className="text-sm text-muted-foreground">To launch</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-brand-teal">15%</div>
                <div className="text-sm text-muted-foreground">Platform fee</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {/* Success State */}
      {completedData && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center space-y-8">
            <div className="animate-bounce-in">
              <h2 className="text-4xl font-bold mb-4">Welcome to your business! 🎉</h2>
              <p className="text-xl text-muted-foreground mb-8">
                You're all set up and ready to start earning. Check your email for next steps.
              </p>
              <Button 
                variant="hero" 
                size="xl"
                onClick={resetOnboarding}
              >
                Start Another Business
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Only show when not in onboarding */}
      {!showOnboarding && !completedData && (
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Built for the ADHD brain 🧠
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                No complicated dashboards, no decision paralysis. 
                Just simple steps that get you from idea to income.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Instant Preview</h3>
                  <p className="text-muted-foreground">
                    See your complete business plan in 60 seconds. Names, products, content - all generated from your idea.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Single Focus</h3>
                  <p className="text-muted-foreground">
                    One clear action per screen. No overwhelming menus or decision fatigue. Just what you need, when you need it.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-brand-orange rounded-full flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Quick Wins</h3>
                  <p className="text-muted-foreground">
                    Launch in under 5 minutes. Your storefront and first campaigns are ready before you can get distracted.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-brand-teal rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">AI Content</h3>
                  <p className="text-muted-foreground">
                    Never stare at a blank page again. Get captions, hooks, and hashtags that match your voice and niche.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-brand-navy rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Smart Posting</h3>
                  <p className="text-muted-foreground">
                    Connect your social accounts and post directly. Or copy content and get reminded when it's the best time to share.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-hero rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Instant Store</h3>
                  <p className="text-muted-foreground">
                    Get a professional storefront with payment processing. Start selling digital products and services immediately.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {!showOnboarding && !completedData && (
        <section id="pricing" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Simple, ADHD-friendly pricing
              </h2>
              <p className="text-xl text-muted-foreground">
                No monthly subscriptions to forget about. Pay once to launch, upgrade when you're ready to scale.
              </p>
            </div>

            <div className="grid gap-8 md:gap-12 lg:grid-cols-3 max-w-5xl mx-auto">
              {/* Free */}
              <Card className="relative">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">Preview</h3>
                    <p className="text-muted-foreground">Test your idea</p>
                  </div>
                  <div>
                    <span className="text-4xl font-bold">Free</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Business name ideas</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Product suggestions</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Sample content</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Positioning statement</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" size="lg">
                    Try Free Preview
                  </Button>
                </CardContent>
              </Card>

              {/* Starter Pack */}
              <Card className="relative border-primary shadow-brand-md">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-accent text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">Starter Pack</h3>
                    <p className="text-muted-foreground">Launch your business</p>
                  </div>
                  <div>
                    <span className="text-4xl font-bold text-brand-orange">$10</span>
                    <span className="text-muted-foreground"> one-time</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Professional storefront</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>2 starter products</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>3 launch campaigns</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Social media posting</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Basic analytics</span>
                    </li>
                  </ul>
                  <Button variant="starter" className="w-full" size="lg">
                    Launch for $10
                  </Button>
                </CardContent>
              </Card>

              {/* Premium */}
              <Card className="relative">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">Premium</h3>
                    <p className="text-muted-foreground">Scale your success</p>
                  </div>
                  <div>
                    <span className="text-4xl font-bold">$10</span>
                    <span className="text-muted-foreground">/week</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Everything in Starter</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>AI image generation</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>A/B test captions</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Unlimited campaigns</span>
                    </li>
                  </ul>
                  <Button variant="premium" className="w-full" size="lg">
                    Upgrade to Premium
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12 p-6 bg-muted/50 rounded-lg max-w-2xl mx-auto">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Platform fee:</strong> We take 15% of your sales (only when you earn). 
                The rest goes directly to your connected Stripe account.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-lg bg-gradient-hero bg-clip-text text-transparent">
                SideHive
              </span>
              <span className="text-muted-foreground">AI Agent Business Platform</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
                Support
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>© 2024 SideHive. Built for the ADHD entrepreneur. 🧠💙</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
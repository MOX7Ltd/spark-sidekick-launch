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
                ✨ Got an idea? Let's launch it.
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in">
                Turn your 
                <span className="bg-gradient-hero bg-clip-text text-transparent">idea</span> into a
                <br />
                <span className="bg-gradient-accent bg-clip-text text-transparent">business in minutes</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up">
                SideHive gives you a shopfront, products, and campaigns — ready to launch.
                <strong className="text-foreground"> Perfect for dreamers, doers, and side-hustlers</strong> who want to bring their ideas to life.
              </p>

              <div className="pt-8 animate-slide-up">
                <Button 
                  variant="hero" 
                  size="xl"
                  onClick={handleStartOnboarding}
                  className="text-xl px-12 py-6 h-auto animate-pulse hover:animate-none"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Start My Business
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  See instant preview • Launch today • Only $10
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
                Built for socials, made for results ⚡
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create campaigns, schedule posts, and track results — all in one place.
                No complicated dashboards, just simple steps that work.
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
                    See your complete business plan in 60 seconds. Names, products, campaigns - all generated from your idea.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Ready-to-Post</h3>
                  <p className="text-muted-foreground">
                    Get hooks, captions, and hashtags that match your voice. Copy-paste or post directly to your socials.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-brand-orange rounded-full flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Launch Today</h3>
                  <p className="text-muted-foreground">
                    Your storefront and first campaigns are ready in minutes. Start selling immediately.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-brand-teal rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Smart Content</h3>
                  <p className="text-muted-foreground">
                    Never stare at a blank page again. Get campaign ideas that match your niche and audience.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-brand-navy rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Growth Tools</h3>
                  <p className="text-muted-foreground">
                    Connect your social accounts, schedule posts, and track what's working. Grow smarter, not harder.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-hero rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Start Earning</h3>
                  <p className="text-muted-foreground">
                    Professional storefront with payment processing. Sell digital products and services from day one.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Who is SideHive for? Section */}
      {!showOnboarding && !completedData && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Who SideHive is for
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Perfect for dreamers, doers, and serial builders who want to launch fast.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Dreamers</h3>
                  <p className="text-muted-foreground">
                    You've got ideas but don't know where to start. We'll help you launch and make it real.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Side-Hustlers</h3>
                  <p className="text-muted-foreground">
                    Turn spare time into income. Launch fast, start earning, and scale at your own pace.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-brand-md transition-smooth">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-brand-orange rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Entrepreneurs</h3>
                  <p className="text-muted-foreground">
                    Launch faster, scale smarter. Skip the setup and focus on what you do best.
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
                Simple, outcome-driven pricing
              </h2>
              <p className="text-xl text-muted-foreground">
                Pay once to launch, upgrade when you're ready to scale. Results guaranteed.
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
                      <span>Sample campaigns</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Positioning statement</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" size="lg" onClick={handleStartOnboarding}>
                    Start My Business
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
                    <p className="text-muted-foreground">Business live today</p>
                  </div>
                  <div>
                    <span className="text-4xl font-bold text-brand-orange">$10</span>
                    <span className="text-muted-foreground"> one-time</span>
                  </div>
                  <div className="text-sm text-brand-orange font-medium mb-4">
                    = Shopfront + 3 campaigns + 2 products
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
                      <span>Payment processing</span>
                    </li>
                  </ul>
                  <Button variant="starter" className="w-full" size="lg">
                    Start My Business
                  </Button>
                </CardContent>
              </Card>

              {/* Premium */}
              <Card className="relative">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">Premium</h3>
                    <p className="text-muted-foreground">Scale faster</p>
                  </div>
                  <div>
                    <span className="text-4xl font-bold">$10</span>
                    <span className="text-muted-foreground">/week</span>
                  </div>
                  <div className="text-sm text-foreground font-medium mb-4">
                    = AI tools + Analytics + Growth features
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
              <span className="text-muted-foreground">Turn ideas into businesses</span>
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
            <p>© 2024 SideHive. Built for dreamers with big ideas. ✨</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
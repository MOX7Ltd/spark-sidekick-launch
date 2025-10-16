import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { ProgressCheckDialog } from '@/components/onboarding/ProgressCheckDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Section from '@/components/site/Section';
import sidehiveLogoTight from '@/assets/sidehive-logo-tight.png';
import { Zap, Target, Rocket, DollarSign, CheckCircle, ArrowRight, Brain, Sparkles, Users, TrendingUp, Clock } from 'lucide-react';
import type { OnboardingData } from '@/types/onboarding';
import type { ProgressInfo } from '@/lib/progressDetector';
const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedData, setCompletedData] = useState<OnboardingData | null>(null);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);

  const handleStartOnboarding = async () => {
    const { detectSavedProgress } = await import('@/lib/progressDetector');
    const progress = await detectSavedProgress();
    
    if (progress.tier === 'none') {
      // No progress found - start fresh immediately
      setShowOnboarding(true);
    } else {
      // Show progress check dialog
      setProgressInfo(progress);
      setShowProgressCheck(true);
    }
  };

  const handleProgressRestored = () => {
    setShowProgressCheck(false);
    setShowOnboarding(true);
  };

  const handleProgressFresh = async () => {
    const { clearOnboardingState } = await import('@/lib/telemetry');
    clearOnboardingState();
    setShowProgressCheck(false);
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
  return <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      {!showOnboarding && !completedData && <Section className="pt-8 md:pt-12">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Logo prominence */}
            <div className="inline-block">
              <img src={sidehiveLogoTight} alt="SideHive" className="h-32 md:h-40 w-auto mx-auto" />
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Turn your <span className="bg-gradient-hero bg-clip-text text-transparent">idea</span> into a
                <br className="hidden md:block" />
                business in minutes
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">SideHive gives you a shopfront, products, and campaigns — ready to launch. Perfect for dreamers, doers, and side-hustlers who want to bring their ideas to life.</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button variant="hero" size="lg" onClick={handleStartOnboarding}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start My Business
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <a href="#pricing">See pricing</a>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground pt-2">
                <span>2 mins setup</span>
                <span>•</span>
                <span>$10 to launch</span>
                <span>•</span>
                <span>15% platform fee</span>
              </div>
            </div>
          </div>
        </Section>}

      {/* Progress Check Dialog */}
      {showProgressCheck && progressInfo && (
        <ProgressCheckDialog
          open={showProgressCheck}
          progressInfo={progressInfo}
          onRestore={handleProgressRestored}
          onFresh={handleProgressFresh}
        />
      )}

      {/* Onboarding Flow */}
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      {/* Success State */}
      {completedData && <Section className="text-center">
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">Welcome to your business! 🎉</h2>
            <p className="text-lg text-muted-foreground">
              You're all set up and ready to start earning. Check your email for next steps.
            </p>
            <Button variant="hero" size="lg" onClick={resetOnboarding}>
              Start Another Business
            </Button>
          </div>
        </Section>}

      {/* Features Section - Only show when not in onboarding */}
      {!showOnboarding && !completedData && <Section id="features" className="bg-background">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Built for socials, made for results ⚡
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create campaigns, schedule posts, and track results — all in one place.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Instant Preview</h3>
                  <p className="text-muted-foreground">
                    See your complete business plan in 60 seconds. Names, products, campaigns - all generated from your idea.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Ready-to-Post</h3>
                  <p className="text-muted-foreground">
                    Get hooks, captions, and hashtags that match your voice. Copy-paste or post directly to your socials.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-brand-orange rounded-full flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Launch Today</h3>
                  <p className="text-muted-foreground">
                    Your storefront and first campaigns are ready in minutes. Start selling immediately.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-brand-teal rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Smart Content</h3>
                  <p className="text-muted-foreground">
                    Never stare at a blank page again. Get campaign ideas that match your niche and audience.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-brand-navy rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Growth Tools</h3>
                  <p className="text-muted-foreground">
                    Connect your social accounts, schedule posts, and track what's working. Grow smarter, not harder.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
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
          </Section>}

      {/* Who is SideHive for? Section */}
      {!showOnboarding && !completedData && <Section className="bg-muted/30">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Who SideHive is for
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Perfect for dreamers, doers, and serial builders who want to launch fast.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-all">
              <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Dreamers</h3>
                  <p className="text-muted-foreground">
                    You've got ideas but don't know where to start. We'll help you launch and make it real.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Side-Hustlers</h3>
                  <p className="text-muted-foreground">
                    Turn spare time into income. Launch fast, start earning, and scale at your own pace.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-brand-orange rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Entrepreneurs</h3>
                  <p className="text-muted-foreground">
                    Launch faster, scale smarter. Skip the setup and focus on what you do best.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Section>}

      {/* Pricing Section */}
      {!showOnboarding && !completedData && <Section id="pricing">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Simple, outcome-driven pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Pay once to launch. We only succeed when you do.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Free Preview */}
              <Card className="relative hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">Preview</h3>
                    <p className="text-sm text-muted-foreground">Test your idea</p>
                  </div>
                  <div>
                    <span className="text-3xl font-bold">Free</span>
                  </div>
                  <ul className="space-y-2 text-sm">
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
                  <Button variant="outline" className="w-full" onClick={handleStartOnboarding}>
                    Start My Business
                  </Button>
                </CardContent>
              </Card>

              {/* Starter Pack */}
              <Card className="relative border-2 border-primary hover:shadow-xl transition-all">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-accent text-white px-3 py-1 text-xs font-medium">
                    Most Popular
                  </Badge>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">Starter Pack</h3>
                    <p className="text-sm text-muted-foreground">Business live today</p>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-brand-orange">$10</span>
                    <span className="text-sm text-muted-foreground"> one-time</span>
                  </div>
                  <p className="text-xs text-brand-orange font-medium">
                    Shopfront + 3 campaigns + 2 products
                  </p>
                  <ul className="space-y-2 text-sm">
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
                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/onboarding/final">Start My Business</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Platform fee: 15% per sale
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8 p-4 bg-muted/50 rounded-xl max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Platform fee:</strong> We take 15% of your sales (only when you earn). 
                The rest goes directly to your connected Stripe account.
              </p>
            </div>
          </Section>}
    </div>;
};
export default Index;
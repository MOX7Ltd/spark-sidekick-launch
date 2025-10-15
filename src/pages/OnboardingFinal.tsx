import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSurface } from '@/components/layout/AppSurface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface BusinessSummary {
  name?: string;
  tagline?: string;
  bio?: string;
  logoUrl?: string;
  logoSvg?: string;
  colors?: string[];
}

export default function OnboardingFinal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (!currentSession) {
        setIsLoading(false);
        return;
      }

      // Fetch business draft
      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', currentSession.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (businesses && businesses.length > 0) {
        const biz = businesses[0];
        setBusinessSummary({
          name: biz.business_name,
          tagline: biz.tagline,
          bio: biz.bio,
          logoUrl: biz.logo_url,
          logoSvg: biz.logo_svg,
          colors: (biz.brand_colors as string[]) || [],
        });
      }

      // Fetch primary AI generations for additional context
      const { data: generations } = await supabase
        .from('ai_generations')
        .select('stage, payload')
        .eq('user_id', currentSession.user.id)
        .eq('primary_selection', true);

      if (generations && generations.length > 0) {
        generations.forEach(gen => {
          const payload = gen.payload as any;
          const response = payload?.response || payload;
          if (gen.stage === 'brand_name' && response?.names) {
            if (!businessSummary.name) {
              setBusinessSummary(prev => ({ ...prev, name: response.names[0] }));
            }
          }
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error loading data',
        description: 'Please try refreshing the page',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateStarterPack = async () => {
    if (!session) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to activate the Starter Pack',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const sessionId = localStorage.getItem('sidehive_session_id') || '';
      const { data, error } = await supabase.functions.invoke('create-starter-session', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <AppSurface>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppSurface>
    );
  }

  // If not authenticated, show signup gate
  if (!session) {
    return (
      <AppSurface>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <CardTitle>Create Your Account</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Your brand is ready! Create an account to save your progress and activate your Starter Pack.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Your work is automatically saved</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Access from any device</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm">Secure & private</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate('/auth/signup?next=/onboarding/final')}
              >
                Continue
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/auth/signin?next=/onboarding/final')}
                  className="underline hover:text-foreground"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </AppSurface>
    );
  }

  // Authenticated user - show summary and Starter Pack
  return (
    <AppSurface>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Your Brand is Ready! 🎉</h1>
          <p className="text-xl text-muted-foreground">
            Activate your Starter Pack to launch your business
          </p>
        </div>

        {/* Business Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Brand Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            {(businessSummary.logoUrl || businessSummary.logoSvg) && (
              <div className="flex justify-center">
                {businessSummary.logoSvg ? (
                  <div 
                    className="w-32 h-32"
                    dangerouslySetInnerHTML={{ __html: businessSummary.logoSvg }}
                  />
                ) : (
                  <img 
                    src={businessSummary.logoUrl} 
                    alt="Business logo" 
                    className="w-32 h-32 object-contain"
                  />
                )}
              </div>
            )}

            {/* Business Name */}
            {businessSummary.name && (
              <div>
                <h3 className="text-2xl font-bold text-center">{businessSummary.name}</h3>
                {businessSummary.tagline && (
                  <p className="text-center text-muted-foreground mt-1">{businessSummary.tagline}</p>
                )}
              </div>
            )}

            {/* Bio */}
            {businessSummary.bio && (
              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground">{businessSummary.bio}</p>
              </div>
            )}

            {/* Brand Colors */}
            {businessSummary.colors && businessSummary.colors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Brand Colors</h4>
                <div className="flex gap-2">
                  {businessSummary.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Starter Pack Card */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>SideHive Starter Pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Live Shopfront</p>
                  <p className="text-sm text-muted-foreground">Your custom domain-ready storefront</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">14-Day Pro Trial</p>
                  <p className="text-sm text-muted-foreground">Full access to all features</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Secure Payments</p>
                  <p className="text-sm text-muted-foreground">Stripe-powered checkout</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">$10 NZD</span>
                <Badge variant="secondary">One-time activation</Badge>
              </div>
              
              <Button
                size="lg"
                className="w-full"
                onClick={handleActivateStarterPack}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Activate Starter Pack'
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe
            </p>
          </CardContent>
        </Card>
      </div>
    </AppSurface>
  );
}

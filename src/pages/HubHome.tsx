import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { HubTile } from '@/components/hub/HubTile';
import { AppSurface } from '@/components/layout/AppSurface';
import { HubBrandHeader } from '@/components/hub/HubBrandHeader';
import HubBrandStrip from '@/components/hub/HubBrandStrip';
import { HubWelcomeCard } from '@/components/hub/HubWelcomeCard';
import { Package, Megaphone, Users, UserCircle2, LogOut, BarChart3, CreditCard, TrendingUp } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { FLAGS } from '@/lib/flags';
import { useToast } from '@/hooks/use-toast';

const startConnectOnboarding = async (toast: any) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const { data, error } = await supabase.functions.invoke('stripe-connect-link', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  } catch (error) {
    console.error('Connect error:', error);
    toast({
      title: "Unable to start Connect onboarding",
      description: "Please try again or contact support.",
      variant: "destructive",
    });
  }
};

export default function HubHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const checkAuthAndAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/signin');
        return;
      }

      const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching business:', error);
        setIsLoading(false);
        return;
      }

      const latestBusiness = businesses?.[0];
      setBusiness(latestBusiness);

      // Fetch profile for trial info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      setProfile(profileData);
      setIsLoading(false);

      if (FLAGS.STRIPE_PAYMENTS_V1 && (!latestBusiness || !latestBusiness.starter_paid)) {
        toast({
          title: "Complete your Starter Pack to unlock your Hub",
          description: "Finish payment to access all features.",
          variant: "destructive",
        });
        navigate('/payment/welcome?type=starter');
        return;
      }

      // Show welcome card on first visit or if not onboarded
      const hasSeenWelcome = localStorage.getItem('hub_welcome_seen');
      if (!hasSeenWelcome || !latestBusiness?.stripe_onboarded) {
        setShowWelcome(true);
        if (!hasSeenWelcome) {
          localStorage.setItem('hub_welcome_seen', 'true');
        }
      }
    };
    
    checkAuthAndAccess();
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'view_hub_home' }
    });
  }, [navigate, toast]);

  const handleLogout = async () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'logout' }
    });
    
    try {
      await supabase.auth.signOut();
    } finally {
      navigate('/');
    }
  };

  const handleTileClick = (section: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'hub_home',
      payload: { action: 'open_hub_section', section }
    });
  };

  if (isLoading) {
    return (
      <AppSurface>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">Loading...</div>
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <HubBrandHeader />
      <HubBrandStrip />

      {showWelcome && (
        <HubWelcomeCard
          name={profile?.display_name || business?.business_name}
          shopfrontUrl={business?.handle ? `${window.location.origin}/s/${business.handle}` : undefined}
          trialEndIso={profile?.subscription_current_period_end}
          stripeOnboarded={business?.stripe_onboarded || false}
          onConnect={() => startConnectOnboarding(toast)}
        />
      )}

      <main className="pb-6">
        <div className="grid grid-cols-2 gap-3">
          <HubTile to="/hub/products" icon={Package} title="Products" desc="Create & manage offers." onClick={() => handleTileClick('products')} />
          <HubTile to="/hub/social" icon={Megaphone} title="Social Media" desc="Plan & publish campaigns." onClick={() => handleTileClick('social')} />
          <HubTile to="/hub/customers" icon={Users} title="Customers" desc="Messages, reviews, calendar." onClick={() => handleTileClick('customers')} />
          <HubTile to="/hub/profile" icon={UserCircle2} title="Profile" desc="Your details & shopfront." onClick={() => handleTileClick('profile')} />
        </div>

        {FLAGS.ANALYTICS_V1 && (
          <div className="mt-3">
            <HubTile to="/hub/analytics" icon={BarChart3} title="Analytics" desc="Track performance & engagement." onClick={() => handleTileClick('analytics')} />
          </div>
        )}

        {FLAGS.STRIPE_PAYMENTS_V1 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <HubTile to="/hub/billing" icon={CreditCard} title="Billing" desc="Subscription & payments." onClick={() => handleTileClick('billing')} />
            <HubTile to="/hub/sales" icon={TrendingUp} title="Sales" desc="Revenue & orders." onClick={() => handleTileClick('sales')} />
          </div>
        )}

        <p className="mt-4 px-1 text-sm leading-relaxed">
          <span className="font-medium" style={{ color: `hsl(var(--sh-teal-600))` }}>Tip:</span>{' '}
          Publish one post today—small steps compound into real revenue.
        </p>
      </main>

      <div 
        className="sticky bottom-0 left-0 right-0 -mx-4 mt-6 backdrop-blur-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        style={{ background: "linear-gradient(to top, rgba(255,255,255,0.85), rgba(255,255,255,0))" }}
      >
        <Button variant="ghost" className="w-full" onClick={handleLogout} aria-label="Log out">
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </div>
    </AppSurface>
  );
}

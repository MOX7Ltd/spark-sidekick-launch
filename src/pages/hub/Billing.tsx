import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { CreditCard, Calendar, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/lib/flags';
import { PricingSummaryCard } from '@/components/pricing/PricingSummaryCard';
import { PricingFAQModal } from '@/components/pricing/PricingFAQModal';

export default function Billing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<{
    status: string;
    currentPeriodEnd: string | null;
  } | null>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  useEffect(() => {
    if (!FLAGS.STRIPE_PAYMENTS_V1) {
      navigate('/hub');
      return;
    }
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth/signin');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_current_period_end')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading subscription:', error);
        toast({
          title: "Error loading subscription",
          description: "Unable to load your subscription details.",
          variant: "destructive",
        });
        return;
      }

      setSubscriptionData({
        status: profile?.subscription_status || 'none',
        currentPeriodEnd: profile?.subscription_current_period_end || null,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSubscription = async () => {
    setIsCreatingSubscription(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue.",
          variant: "destructive",
        });
        navigate('/auth/signin');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating subscription:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }

      if (!data?.url) {
        throw new Error('No subscription URL returned');
      }

      // Redirect to Stripe subscription checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription setup failed",
        description: error instanceof Error ? error.message : "Unable to set up subscription. Please try again.",
        variant: "destructive",
      });
      setIsCreatingSubscription(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trialing':
        return <Badge className="bg-blue-500">Free Trial</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Payment Due</Badge>;
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>;
      case 'incomplete':
        return <Badge variant="secondary">Incomplete</Badge>;
      default:
        return <Badge variant="outline">No Subscription</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trialing':
      case 'active':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'past_due':
        return <AlertCircle className="h-12 w-12 text-red-500" />;
      default:
        return <CreditCard className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const formatPeriodEnd = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (!FLAGS.STRIPE_PAYMENTS_V1) {
    return null;
  }

  return (
    <AppSurface>
      <BackBar to="/hub" label="Back to Hub" />
      
      <div className="mx-auto mt-6 max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your SideHive Pro subscription</p>
          </div>
          <PricingFAQModal />
        </div>

        {isLoading ? (
          <Card className="p-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading subscription details...</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pricing Overview */}
            <PricingSummaryCard />

            {/* Current Plan Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(subscriptionData?.status || 'none')}
                    <div>
                      <h2 className="text-2xl font-bold">SideHive Pro</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(subscriptionData?.status || 'none')}
                      </div>
                    </div>
                  </div>

                  {subscriptionData?.status === 'trialing' && subscriptionData.currentPeriodEnd && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Free trial active</p>
                          <p className="text-sm text-blue-700">
                            Trial ends {formatPeriodEnd(subscriptionData.currentPeriodEnd)}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            $25 NZD/month billing starts automatically after trial
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscriptionData?.status === 'active' && subscriptionData.currentPeriodEnd && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">Subscription active</p>
                          <p className="text-sm text-green-700">
                            Next renewal {formatPeriodEnd(subscriptionData.currentPeriodEnd)}
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            $25 NZD per month
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscriptionData?.status === 'past_due' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-900">Payment issue</p>
                          <p className="text-sm text-red-700">
                            Please update your payment method to continue using SideHive Pro
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(!subscriptionData?.status || subscriptionData.status === 'none') && (
                    <div className="bg-muted rounded-lg p-4">
                      <p className="font-medium">No active subscription</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start your 14-day free trial of SideHive Pro
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                {(!subscriptionData?.status || subscriptionData.status === 'none') && (
                  <Button
                    onClick={handleStartSubscription}
                    disabled={isCreatingSubscription}
                    size="lg"
                    className="w-full"
                  >
                    {isCreatingSubscription ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up subscription...
                      </>
                    ) : (
                      'Start 14-Day Free Trial'
                    )}
                  </Button>
                )}

                {subscriptionData?.status === 'past_due' && (
                  <Button
                    onClick={handleStartSubscription}
                    variant="destructive"
                    size="lg"
                    className="w-full"
                  >
                    Update Payment Method
                  </Button>
                )}

                {(subscriptionData?.status === 'active' || subscriptionData?.status === 'trialing') && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Manage your subscription, payment methods, and billing history through Stripe
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Pricing Details Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pricing Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Subscription</span>
                  <span className="font-semibold">$25 NZD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform Fee (per sale)</span>
                  <span className="font-semibold">15%</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    The 15% platform fee covers Stripe processing, currency conversion, and platform services. Cancel anytime.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppSurface>
  );
}

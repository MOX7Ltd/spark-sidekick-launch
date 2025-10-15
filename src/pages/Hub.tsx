import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Hub() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasStarterPaid, setHasStarterPaid] = useState(false);

  useEffect(() => {
    checkAuthAndPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndPayment = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/signin');
        return;
      }

      // Fetch user's profile and businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('starter_paid')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const paid = businesses?.[0]?.starter_paid || false;
      setHasStarterPaid(paid);

      // Redirect to payment if not paid
      if (!paid) {
        navigate('/payment/welcome?type=starter');
        return;
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Error checking auth and payment:', error);
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Hub</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Starter Pack Warning Banner */}
        {!hasStarterPaid && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Starter Pack Required</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Complete your Starter Pack to access the Hub features.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/payment/welcome?type=starter')}
                className="ml-4"
              >
                Complete Setup
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-2">Product Lab</h2>
            <p className="text-muted-foreground">Create and manage your products</p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-2">Campaign Lab</h2>
            <p className="text-muted-foreground">Design marketing campaigns</p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-2">Customer Inbox</h2>
            <p className="text-muted-foreground">Manage customer communications</p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold mb-2">Shopfront Manager</h2>
            <p className="text-muted-foreground">Customize your storefront</p>
          </div>
        </div>

        <div className="mt-8 text-center text-muted-foreground">
          <p>Your Hub is being set up. More features coming soon!</p>
        </div>
      </main>
    </div>
  );
}

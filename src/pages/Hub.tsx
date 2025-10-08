import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function Hub() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/signin');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, Package, Megaphone, User, LogOut } from 'lucide-react';

export default function Hub() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUser(session.user);
    await loadUserData(session.user.id);
    setIsLoading(false);
  };

  const loadUserData = async (userId: string) => {
    // Load businesses
    const { data: bizData } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId);
    
    if (bizData) setBusinesses(bizData);

    // Load products
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);
    
    if (prodData) setProducts(prodData);

    // Load campaigns
    if (bizData && bizData.length > 0) {
      const { data: campData } = await supabase
        .from('campaigns')
        .select('*, campaign_items(*)')
        .eq('business_id', bizData[0].id);
      
      if (campData) setCampaigns(campData);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SideHive Hub</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            {user?.email}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Businesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Your Businesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {businesses.length > 0 ? (
                <div className="space-y-4">
                  {businesses.map((business) => (
                    <div key={business.id} className="p-3 border rounded-lg">
                      <h3 className="font-semibold">{business.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{business.tagline}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No businesses yet</p>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-2">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="p-2 border rounded">
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.format}</p>
                    </div>
                  ))}
                  {products.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      +{products.length - 5} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No products yet</p>
              )}
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Your Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="space-y-2">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-2 border rounded">
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.campaign_items?.length || 0} posts
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No campaigns yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {businesses.length === 0 && products.length === 0 && campaigns.length === 0 && (
          <Card className="mt-8">
            <CardContent className="py-8 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                You haven't created anything yet. Start your journey!
              </p>
              <Button onClick={() => navigate('/')}>
                Start Onboarding
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateProfileWizard } from '@/components/hub/CreateProfileWizard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { OnboardingData } from '@/types/onboarding';

export default function CreateProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasExistingIdentity, setHasExistingIdentity] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    checkExistingIdentity();
  }, []);

  const checkExistingIdentity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has existing business identity
      const { data: business } = await supabase
        .from('businesses')
        .select('id, business_name, bio')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (business?.business_name) {
        setHasExistingIdentity(true);
        setShowWarning(true);
      }
    } catch (error) {
      console.error('Error checking identity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (data: OnboardingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save business identity
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .upsert({
          owner_id: user.id,
          business_name: data.businessIdentity.name,
          tagline: data.businessIdentity.tagline,
          bio: data.businessIdentity.bio,
          logo_svg: data.businessIdentity.logoSVG || data.businessIdentity.logoUrl,
          brand_colors: data.businessIdentity.colors,
          audience: data.audiences.join(','),
          status: 'active'
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Save products if any were generated
      if (data.products && data.products.length > 0) {
        const productsToInsert = data.products.map(p => ({
          user_id: user.id,
          business_id: business.id,
          title: p.title,
          format: p.format,
          description: p.description,
          is_draft: true,
          visible: false
        }));

        const { error: productsError } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (productsError) console.error('Error saving products:', productsError);
      }

      // Log event
      const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID();
      await supabase.from('events').insert({
        session_id: sessionId,
        trace_id: `hub-profile-created-${user.id}-${Date.now()}`,
        action: 'hub_profile_created',
        step: 'create_profile',
        ok: true,
        payload_keys: ['business_name', 'products_count']
      });

      toast({
        title: "Profile created!",
        description: "Your brand identity has been set up successfully.",
      });

      navigate('/hub/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Failed to save profile",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showWarning && hasExistingIdentity) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md p-6">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Profile Already Exists</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You already have a business profile. Creating a new one will replace your existing brand identity, logo, and bio.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/hub/dashboard')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowWarning(false)}
              className="flex-1 bg-gradient-to-r from-primary to-orange-500"
            >
              Replace Profile
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <CreateProfileWizard onComplete={handleComplete} />;
}

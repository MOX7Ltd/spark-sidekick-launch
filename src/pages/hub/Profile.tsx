import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { ShopfrontHeaderPreview } from '@/components/profile/ShopfrontHeaderPreview';
import { LogoRegenerator } from '@/components/profile/LogoRegenerator';
import { BioTaglineRegenerator } from '@/components/profile/BioTaglineRegenerator';
import { getBusinessIdentity, updateBusinessIdentity, type BusinessIdentity } from '@/lib/db/identity';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Edit } from 'lucide-react';
import { SkeletonCard } from '@/components/hub/SkeletonCard';
import { MicroGuidance } from '@/components/hub/MicroGuidance';

export default function Profile() {
  const [identity, setIdentity] = useState<BusinessIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    tagline: '',
    bio: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadIdentity();
  }, []);

  const loadIdentity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getBusinessIdentity(user.id);
      if (data) {
        setIdentity(data);
        setFormData({
          business_name: data.business_name,
          tagline: data.tagline || '',
          bio: data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error loading identity:', error);
      toast({
        title: "Failed to load profile",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!identity) return;

    setIsSaving(true);
    try {
      const updatedIdentity = await updateBusinessIdentity(identity.id, {
        business_name: formData.business_name,
        tagline: formData.tagline,
        bio: formData.bio,
      });
      
      setIdentity(updatedIdentity);

      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpdated = async (logoSvg: string) => {
    if (!identity) return;

    try {
      const updatedIdentity = await updateBusinessIdentity(identity.id, {
        logo_svg: logoSvg
      });
      setIdentity(updatedIdentity);
    } catch (error) {
      console.error('Error updating logo:', error);
      toast({
        title: "Logo update failed",
        description: "Could not save the new logo.",
        variant: "destructive"
      });
    }
  };

  const handleBioUpdated = async (bio: string) => {
    if (!identity) return;

    try {
      const updatedIdentity = await updateBusinessIdentity(identity.id, { bio });
      setIdentity(updatedIdentity);
      setFormData(prev => ({ ...prev, bio }));
    } catch (error) {
      console.error('Error updating bio:', error);
      toast({
        title: "Bio update failed",
        description: "Could not save the new bio.",
        variant: "destructive"
      });
    }
  };

  const handleTaglineUpdated = async (tagline: string) => {
    if (!identity) return;

    try {
      const updatedIdentity = await updateBusinessIdentity(identity.id, { tagline });
      setIdentity(updatedIdentity);
      setFormData(prev => ({ ...prev, tagline }));
    } catch (error) {
      console.error('Error updating tagline:', error);
      toast({
        title: "Tagline update failed",
        description: "Could not save the new tagline.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Your Business Profile"
          subtitle="Edit your brand identity and preview your live storefront."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No business profile found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Complete onboarding to create your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Your Business Profile"
        subtitle="Edit your brand identity and preview your live storefront."
      />
      <MicroGuidance text="Your profile is the face of your business — make it shine! ✨" />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column: Edit form */}
        <div className="space-y-6">
          {/* Identity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Identity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {identity.logo_svg ? (
                  <div
                    className="w-16 h-16 shrink-0 border rounded-lg flex items-center justify-center overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: identity.logo_svg }}
                  />
                ) : (
                  <div className="w-16 h-16 shrink-0 border rounded-lg flex items-center justify-center text-xl font-bold bg-muted">
                    {identity.business_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{identity.business_name}</h3>
                  {identity.tagline && (
                    <p className="text-sm text-muted-foreground">{identity.tagline}</p>
                  )}
                </div>
              </div>
              
              {identity.brand_colors && identity.brand_colors.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Brand Colors</Label>
                  <div className="flex gap-2">
                    {identity.brand_colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Your business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="A short tagline..."
                />
                <BioTaglineRegenerator
                  type="tagline"
                  identity={identity}
                  onAccept={handleTaglineUpdated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell customers about your business..."
                  className="min-h-32 resize-none"
                />
                <BioTaglineRegenerator
                  type="bio"
                  identity={identity}
                  onAccept={handleBioUpdated}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {identity.logo_svg && (
                    <div
                      className="w-20 h-20 border rounded-lg flex items-center justify-center overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: identity.logo_svg }}
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <LogoRegenerator
                      businessName={identity.business_name}
                      currentLogo={identity.logo_svg}
                      onLogoSelected={handleLogoUpdated}
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate a new logo with AI
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="hero"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <ShopfrontHeaderPreview
            name={formData.business_name || identity.business_name}
            tagline={formData.tagline || identity.tagline}
            bio={formData.bio || identity.bio}
            logoSvg={identity.logo_svg}
            colors={identity.brand_colors || []}
          />
        </div>
      </div>

      {/* Mobile sticky save button */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <Button
          variant="hero"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full shadow-lg gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

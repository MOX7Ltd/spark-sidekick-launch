import { useState, useEffect, useCallback, useRef } from 'react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CampaignIdeaForm } from '@/components/social/CampaignIdeaForm';
import { CampaignConceptCard, CampaignConcept } from '@/components/social/CampaignConceptCard';
import { PlatformPicker } from '@/components/social/PlatformPicker';
import { UiPlatform, normalizeForDb } from '@/lib/platforms';
import { Post } from '@/components/social/PostCard';
import { BeakerLoader } from '@/components/fx/BeakerLoader';
import { toast } from '@/hooks/use-toast';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

type Mode = 'choose' | 'suggest' | 'defined';

export default function SocialLab() {
  const [mode, setMode] = useState<Mode>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<UiPlatform[]>(['instagram', 'tiktok']);
  const [concepts, setConcepts] = useState<CampaignConcept[]>([]);
  const [businessContext, setBusinessContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSuggestedRef = useRef(false);

  useEffect(() => {
    logFrontendEvent({ eventType: 'step_transition', step: 'social_lab', payload: {} });
    loadBusinessContext();
  }, []);

  const loadBusinessContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (businesses && businesses.length > 0) {
        setBusinessContext(businesses[0]);
      }
    } catch (error) {
      console.error('Error loading business context:', error);
    }
  };

  const handleModeSelect = (selectedMode: Mode) => {
    setMode(selectedMode);
    logFrontendEvent({
      eventType: 'user_action',
      step: 'social_lab',
      payload: { action: 'mode_select', mode: selectedMode }
    });
  };

  const handleGenerate = useCallback(async (formData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const requestBody = {
        user_id: user?.id,
        mode: mode === 'suggest' ? 'suggest' : 'defined',
        idea: formData.idea || '',
        goal: formData.goal || 'awareness',
        audienceHints: formData.audienceHints || [],
        angle: formData.angle || [],
        durationPreset: formData.duration || '7d',
        platforms: selectedPlatforms,
        business_context: businessContext ? {
          name: businessContext.business_name,
          tagline: businessContext.tagline,
          bio: businessContext.bio,
          audiences: Array.isArray(businessContext.audiences) 
            ? businessContext.audiences 
            : (businessContext.audience ? [businessContext.audience] : []),
          vibes: businessContext.tone_tags
        } : undefined
      };

      console.log('[SocialLab] Generating concepts:', requestBody);

      const { data, error: functionError } = await supabase.functions.invoke('generate-campaign-concepts', {
        body: requestBody
      });

      if (functionError) throw functionError;

      console.log('[SocialLab] Received concepts:', data?.concepts?.map((c: any) => ({
        title: c.title,
        posts_keys: Object.keys(c.posts_by_platform || {}),
        posts_count: Object.values(c.posts_by_platform || {}).flat().length
      })));

      setConcepts(Array.isArray(data?.concepts) ? data.concepts : []);
    } catch (error: any) {
      console.error('[SocialLab] Generation error:', error);
      setError(error?.message || 'Could not generate concepts. Please try again.');
      toast({
        title: 'Generation failed',
        description: error?.message || 'Could not generate campaign concepts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [mode, selectedPlatforms, businessContext]);

  const handleAddToCampaign = async (post: Post) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Please sign in',
          description: 'You need to be signed in to save posts',
          variant: 'destructive'
        });
        return;
      }

      // Get or create user's business
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!businesses || businesses.length === 0) {
        toast({
          title: 'No business found',
          description: 'Please complete onboarding first',
          variant: 'destructive'
        });
        return;
      }

      const businessId = businesses[0].id;

      // Get or create a "Draft Campaign"
      let campaignId: string;
      const { data: existingCampaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('business_id', businessId)
        .eq('status', 'draft')
        .limit(1);

      if (existingCampaigns && existingCampaigns.length > 0) {
        campaignId = existingCampaigns[0].id;
      } else {
        const { data: newCampaign, error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            business_id: businessId,
            name: 'Draft Campaign',
            status: 'draft',
            type: 'social'
          })
          .select('id')
          .single();

        if (campaignError) throw campaignError;
        campaignId = newCampaign.id;
      }

      // Normalize platform for DB
      const platform = normalizeForDb(post.platform);
      if (!platform) {
        toast({
          title: 'Platform not supported',
          description: `${post.platform} is not yet supported for saving`,
          variant: 'destructive'
        });
        return;
      }

      // Check for duplicates
      const { data: existing } = await supabase
        .from('campaign_items')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('platform', platform)
        .eq('hook', post.hook)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({
          title: 'Already added',
          description: 'This post is already in your campaign',
        });
        return;
      }

      // Insert the post
      const { error: insertError } = await supabase
        .from('campaign_items')
        .insert({
          campaign_id: campaignId,
          platform,
          hook: post.hook,
          caption: post.caption,
          hashtags: post.hashtags
        });

      if (insertError) throw insertError;

      toast({
        title: 'Added to campaign',
        description: 'Post has been saved to your draft campaign',
      });
    } catch (error: any) {
      console.error('[SocialLab] Error adding to campaign:', error);
      toast({
        title: 'Failed to save',
        description: error.message || 'Could not save post to campaign',
        variant: 'destructive'
      });
    }
  };

  const handleMoreLikeThis = (conceptId: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'social_lab',
      payload: { action: 'more_like_this', concept_id: conceptId }
    });
    toast({ title: 'Generating similar concepts...', description: 'Coming soon' });
  };

  const handleReject = (conceptId: string) => {
    setConcepts(concepts.filter(c => c.id !== conceptId));
    logFrontendEvent({
      eventType: 'user_action',
      step: 'social_lab',
      payload: { action: 'reject', kind: 'concept', concept_id: conceptId }
    });
  };

  const handleRejectPost = (post: Post) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'social_lab',
      payload: { action: 'reject', kind: 'post', platform: post.platform }
    });
  };

  const resetToChoose = () => {
    setMode('choose');
    setConcepts([]);
  };

  // Auto-generate on suggest mode
  useEffect(() => {
    if (mode === 'suggest' && !hasAutoSuggestedRef.current) {
      hasAutoSuggestedRef.current = true;
      setConcepts([]);
      
      // Support both singular and plural audience
      const audienceHints = Array.isArray(businessContext?.audiences) 
        ? businessContext.audiences 
        : (businessContext?.audience ? [businessContext.audience] : []);
      
      handleGenerate({
        mode: 'suggest',
        idea: '',
        goal: 'awareness',
        angle: [],
        duration: '7d',
        audienceHints,
        platforms: selectedPlatforms
      });
    }
  }, [mode, handleGenerate, businessContext, selectedPlatforms]);

  // Reset guard when leaving suggest mode
  useEffect(() => {
    if (mode !== 'suggest') hasAutoSuggestedRef.current = false;
  }, [mode]);

  return (
    <AppSurface>
      <BackBar to="/hub/social" label="Back to Social" />
      
      <div className="max-w-4xl mx-auto mt-6 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Lab</h1>
          <p className="text-muted-foreground">Small experiments → big reach.</p>
        </div>

        {mode === 'choose' && (
          <div className="mt-6 space-y-3 max-w-md mx-auto">
            <Button
              onClick={() => handleModeSelect('suggest')}
              className="w-full h-auto py-6 px-6 rounded-2xl bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:opacity-90 transition-opacity disabled:opacity-70"
              disabled={isLoading}
            >
              <div className="text-left w-full">
                <div className="font-bold text-lg mb-1">Need ideas?</div>
                <div className="text-sm opacity-90">We'll suggest a few campaigns</div>
              </div>
            </Button>

            <Button
              onClick={() => handleModeSelect('defined')}
              className="w-full h-auto py-6 px-6 rounded-2xl backdrop-blur bg-white/75 border border-white/30 shadow-lg hover:bg-white/90 transition-colors disabled:opacity-70"
              variant="outline"
              disabled={isLoading}
            >
              <div className="text-left w-full">
                <div className="font-bold text-lg mb-1 text-foreground">I've got a campaign in mind</div>
                <div className="text-sm text-muted-foreground">Tell us what you want to create</div>
              </div>
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Small experiments → big reach.
            </p>
          </div>
        )}

        {/* Error display (inline, non-disruptive) */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 max-w-md mx-auto">
            <div className="text-sm text-red-700 mb-2">{error}</div>
            <Button
              onClick={() => {
                setError(null);
                if (mode === 'suggest') {
                  hasAutoSuggestedRef.current = false;
                  handleModeSelect('suggest');
                }
              }}
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Try again
            </Button>
          </div>
        )}

        {mode !== 'choose' && (
          <PlatformPicker
            selected={selectedPlatforms}
            onChange={setSelectedPlatforms}
            className="sticky top-[calc(var(--appbar-height,56px)+8px)] z-10"
          />
        )}

        {mode === 'defined' && !isLoading && concepts.length === 0 && !error && (
          <div className="mt-4">
            <CampaignIdeaForm
              onGenerate={(formData) => handleGenerate(formData)}
              audienceHints={businessContext?.audience ? [businessContext.audience] : []}
              onCancel={resetToChoose}
            />
          </div>
        )}

        {mode === 'suggest' && isLoading && concepts.length === 0 && (
          <div className="mt-8">
            <BeakerLoader label="Mixing campaign ideas..." />
          </div>
        )}

        {concepts.length > 0 && (
          <>
            <div className="space-y-6 mt-6">
              {concepts.map((concept) => (
                <CampaignConceptCard
                  key={concept.id}
                  concept={concept}
                  selectedPlatforms={selectedPlatforms}
                  onAddToCampaign={handleAddToCampaign}
                  onMoreLikeThis={handleMoreLikeThis}
                  onMoreLikeThisPost={handleAddToCampaign}
                  onReject={handleReject}
                  onRejectPost={handleRejectPost}
                />
              ))}
            </div>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4 mt-8 flex justify-between">
              <Button variant="ghost" onClick={resetToChoose}>
                Start a new idea
              </Button>
              <Button
                onClick={() => handleGenerate({})}
                className="bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white"
              >
                Regenerate
              </Button>
            </div>
          </>
        )}
      </div>
    </AppSurface>
  );
}

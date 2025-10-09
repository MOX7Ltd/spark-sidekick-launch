import { useState, useEffect } from 'react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Button } from '@/components/ui/button';
import { LabAura } from '@/components/fx/LabAura';
import { BeakerLoader } from '@/components/fx/BeakerLoader';
import { CampaignIdeaForm } from '@/components/social/CampaignIdeaForm';
import { PlatformPicker } from '@/components/social/PlatformPicker';
import { CampaignConceptCard, CampaignConcept } from '@/components/social/CampaignConceptCard';
import { Post } from '@/components/social/PostCard';
import { Platform, normalizePlatform, ALLOWED_PLATFORMS_DB } from '@/lib/socialLab';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { Sparkles, Lightbulb } from 'lucide-react';

type Mode = 'choose' | 'suggest' | 'defined';

export default function SocialLab() {
  const [mode, setMode] = useState<Mode>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram', 'tiktok']);
  const [concepts, setConcepts] = useState<CampaignConcept[]>([]);
  const [businessContext, setBusinessContext] = useState<any>(null);

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

  const handleGenerate = async (formData: any) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const requestBody = {
        user_id: user?.id,
        mode: mode === 'suggest' ? 'suggest' : 'defined',
        idea: formData.idea,
        goal: formData.goal,
        audienceHints: formData.audienceHints,
        angle: formData.angle,
        durationPreset: formData.duration,
        platforms: selectedPlatforms,
        business_context: businessContext ? {
          name: businessContext.business_name,
          tagline: businessContext.tagline,
          bio: businessContext.bio,
          audiences: businessContext.audience ? [businessContext.audience] : [],
          vibes: businessContext.tone_tags || []
        } : undefined
      };

      logFrontendEvent({
        eventType: 'user_action',
        step: 'social_lab',
        payload: {
          action: 'generate',
          platforms: selectedPlatforms,
          goal: formData.goal,
          duration: formData.duration
        }
      });

      const { data, error } = await supabase.functions.invoke('generate-campaign-concepts', {
        body: requestBody
      });

      if (error) throw error;

      if (data && data.concepts) {
        setConcepts(data.concepts);
      } else {
        throw new Error('No concepts returned');
      }
    } catch (error: any) {
      console.error('Error generating concepts:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Could not generate campaign concepts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCampaign = async (post: Post) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Please sign in to save posts', variant: 'destructive' });
        return;
      }

      const normalizedPlatform = normalizePlatform(post.platform);
      
      // Check if platform is supported in DB
      if (!normalizedPlatform) {
        // Copy to clipboard for unsupported platforms
        const text = `${post.hook}\n\n${post.caption}\n\n${post.hashtags.join(' ')}`;
        await navigator.clipboard.writeText(text);
        toast({
          title: 'Saved copy to clipboard',
          description: `We'll support saving ${post.platform} posts soon.`
        });
        return;
      }

      // Get or create campaign
      let campaignId: string;
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('business_id', businessContext?.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (campaigns && campaigns.length > 0) {
        campaignId = campaigns[0].id;
      } else {
        const { data: newCampaign, error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            business_id: businessContext?.id,
            name: 'From Social Lab',
            type: 'social',
            status: 'draft'
          })
          .select('id')
          .single();

        if (campaignError) throw campaignError;
        campaignId = newCampaign.id;
      }

      // Check for duplicates
      const { data: existing } = await supabase
        .from('campaign_items')
        .select('hook')
        .eq('campaign_id', campaignId)
        .eq('platform', normalizedPlatform);

      const isDuplicate = existing?.some(item => item.hook === post.hook);
      
      if (isDuplicate) {
        toast({ title: 'This post is already in your campaign', variant: 'default' });
        return;
      }

      // Insert post
      const { error: insertError } = await supabase
        .from('campaign_items')
        .insert({
          campaign_id: campaignId,
          platform: normalizedPlatform,
          hook: post.hook,
          caption: post.caption,
          hashtags: post.hashtags,
          meta: { media_guide: post.media_guide, source: 'lab' }
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      toast({
        title: 'Draft added to Manage Posts ✨',
        description: 'Find it in your campaigns'
      });

      logFrontendEvent({
        eventType: 'user_action',
        step: 'social_lab',
        payload: { action: 'add_post', campaign_id: campaignId, platform: normalizedPlatform }
      });
    } catch (error: any) {
      console.error('Error adding to campaign:', error);
      toast({
        title: 'Could not save post',
        description: error.message,
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

  return (
    <AppSurface>
      <LabAura />
      <BackBar to="/hub/social" label="Back to Social" />
      
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Lab</h1>
          <p className="text-muted-foreground">Small experiments → big reach. Ship one post today.</p>
        </div>

        {mode === 'choose' && !isLoading && concepts.length === 0 && (
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Button
              onClick={() => handleModeSelect('suggest')}
              className="h-32 flex flex-col gap-2 bg-background/60 backdrop-blur-sm border-2 hover:border-primary"
              variant="outline"
            >
              <Lightbulb className="h-8 w-8" />
              <span className="font-semibold">Need ideas?</span>
              <span className="text-xs text-muted-foreground">Get campaign suggestions</span>
            </Button>
            <Button
              onClick={() => handleModeSelect('defined')}
              className="h-32 flex flex-col gap-2 bg-background/60 backdrop-blur-sm border-2 hover:border-primary"
              variant="outline"
            >
              <Sparkles className="h-8 w-8" />
              <span className="font-semibold">I've got one</span>
              <span className="text-xs text-muted-foreground">Define your campaign</span>
            </Button>
          </div>
        )}

        {mode === 'defined' && concepts.length === 0 && !isLoading && (
          <CampaignIdeaForm
            onGenerate={handleGenerate}
            audienceHints={businessContext?.audience ? [businessContext.audience] : []}
            onCancel={resetToChoose}
          />
        )}

        {isLoading && (
          <div className="py-12">
            <BeakerLoader label="Brewing your campaign..." />
          </div>
        )}

        {concepts.length > 0 && (
          <>
            <PlatformPicker
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
            />
            
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

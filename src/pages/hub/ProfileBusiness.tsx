import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { SubHeader } from '@/components/hub/SubHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { uploadPublic, generateStoragePath } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useHubBranding } from '@/hooks/useHubBranding';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Business {
  id: string;
  business_name: string | null;
  tagline: string | null;
  bio: string | null;
  logo_url: string | null;
  logo_svg: string | null;
  brand_colors: any;
  tone_tags: string[] | null;
  meta: any;
}

export default function ProfileBusiness() {
  const { toast } = useToast();
  const { refetch: refetchBranding } = useHubBranding();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [businessId, setBusinessId] = useState<string>('');
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Previous state for revert
  const [savedState, setSavedState] = useState({ 
    businessName: '', tagline: '', bio: '', logoUrl: '' 
  });
  
  // AI assist state
  const [showAISheet, setShowAISheet] = useState(false);
  const [aiAction, setAiAction] = useState<'rename' | 'tagline' | 'bio'>('rename');
  const [aiTone, setAiTone] = useState('friendly');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Please sign in', variant: 'destructive' });
        return;
      }
      
      setUserId(user.id);
      
      // Try to get existing business
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, business_name, tagline, bio, logo_url, logo_svg')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (business) {
        setBusinessId(business.id);
        setBusinessName(business.business_name || '');
        setTagline(business.tagline || '');
        setBio(business.bio || '');
        setLogoUrl(business.logo_url || business.logo_svg || '');
        setSavedState({
          businessName: business.business_name || '',
          tagline: business.tagline || '',
          bio: business.bio || '',
          logoUrl: business.logo_url || business.logo_svg || ''
        });
      } else {
        // Create a new business row
        const { data: newBusiness, error: createError } = await supabase
          .from('businesses')
          .insert({
            owner_id: user.id
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setBusinessId(newBusiness.id);
      }
    } catch (error) {
      console.error('Failed to load business:', error);
      toast({ title: 'Failed to load business', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      toast({ title: 'Business name is required', variant: 'destructive' });
      return;
    }
    
    if (businessName.length > 60) {
      toast({ title: 'Business name must be 60 characters or less', variant: 'destructive' });
      return;
    }
    
    if (tagline.length > 120) {
      toast({ title: 'Tagline must be 120 characters or less', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let finalLogoUrl = logoUrl;
      let finalLogoSvg = null;
      
      // Upload logo if changed
      if (logoFile) {
        const path = generateStoragePath(userId, 'logo', logoFile.name);
        const { url, error } = await uploadPublic('brand-assets', path, logoFile);
        if (error) {
          toast({ title: 'Logo upload failed', description: error, variant: 'destructive' });
          setSaving(false);
          return;
        }
        
        // Check if SVG
        if (logoFile.name.toLowerCase().endsWith('.svg')) {
          const text = await logoFile.text();
          finalLogoSvg = text;
          finalLogoUrl = '';
        } else {
          finalLogoUrl = url;
          finalLogoSvg = null;
        }
      }

      // Update business
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          business_name: businessName,
          tagline: tagline || null,
          bio: bio || null,
          logo_url: finalLogoUrl || null,
          logo_svg: finalLogoSvg
        })
        .eq('id', businessId);

      if (updateError) throw updateError;

      setLogoUrl(finalLogoUrl || finalLogoSvg || '');
      setLogoFile(null);
      setSavedState({ businessName, tagline, bio, logoUrl: finalLogoUrl || finalLogoSvg || '' });
      
      // Refresh hub branding immediately
      refetchBranding();
      
      toast({ title: 'Business profile saved successfully' });
    } catch (error) {
      console.error('Save failed:', error);
      toast({ title: 'Failed to save business profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setBusinessName(savedState.businessName);
    setTagline(savedState.tagline);
    setBio(savedState.bio);
    setLogoUrl(savedState.logoUrl);
    setLogoFile(null);
    toast({ title: 'Changes reverted' });
  };

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      let action = '';
      let payload: any = {};
      
      if (aiAction === 'rename') {
        action = 'rename_business';
        payload = { current_name: businessName, vibe_tags: [aiTone] };
      } else if (aiAction === 'tagline') {
        action = 'write_tagline';
        payload = { business_name: businessName, vibe_tags: [aiTone] };
      } else if (aiAction === 'bio') {
        action = 'rewrite_business_bio';
        payload = { current_bio: bio, tone: aiTone };
      }

      const { data, error } = await supabase.functions.invoke('profile-assist', {
        body: { action, payload }
      });

      if (error) throw error;
      
      setAiResult(data);
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({ title: 'AI assist failed', description: String(error), variant: 'destructive' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAcceptAI = (value?: string) => {
    if (aiAction === 'rename' && value) {
      setBusinessName(value);
    } else if (aiAction === 'tagline' && aiResult?.tagline) {
      setTagline(aiResult.tagline);
    } else if (aiAction === 'bio' && aiResult?.bio) {
      setBio(aiResult.bio);
    }
    setShowAISheet(false);
    setAiResult(null);
    toast({ title: 'Applied AI suggestion' });
  };

  const openAISheet = (action: 'rename' | 'tagline' | 'bio') => {
    setAiAction(action);
    setAiResult(null);
    setShowAISheet(true);
  };

  if (loading) {
    return (
      <AppSurface>
        <BackBar to="/hub/profile" label="Back to Profile" />
        <div className="mt-8 text-center text-muted-foreground">Loading...</div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <BackBar to="/hub/profile" label="Back to Profile" />
      
      <SubHeader
        icon={<Building2 className="h-5 w-5" />}
        title="Your Business"
        subtitle="Your brand should feel like you."
      />

      <div className="mt-6 space-y-6">
        {/* Logo */}
        <div>
          <Label>Business Logo</Label>
          <div className="mt-2">
            <ImageUploader
              value={logoUrl}
              onChange={setLogoFile}
              accept=".png,.jpg,.jpeg,.svg"
            />
          </div>
        </div>

        {/* Business Name */}
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business name"
            maxLength={60}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">{businessName.length}/60 characters</p>
          <p className="text-xs text-[hsl(var(--sh-teal-600))] mt-2">
            Your brand name should be clear, memorable, and yours.
          </p>
        </div>

        {/* Tagline */}
        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="What you do in a few words"
            maxLength={120}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">{tagline.length}/120 characters</p>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio">About Your Business</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about your business..."
            rows={4}
            className="mt-2"
          />
        </div>

        {/* AI Assist */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAISheet('rename')}
            disabled={!businessName.trim()}
          >
            Rename business
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAISheet('tagline')}
            disabled={!businessName.trim()}
          >
            Write tagline
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAISheet('bio')}
            disabled={!bio.trim()}
          >
            Rewrite bio
          </Button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex gap-3 pb-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outline"
          onClick={handleRevert}
          disabled={saving}
        >
          Revert
        </Button>
      </div>

      {/* AI Assist Sheet */}
      <Sheet open={showAISheet} onOpenChange={setShowAISheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>
              {aiAction === 'rename' && 'Rename Business'}
              {aiAction === 'tagline' && 'Write Tagline'}
              {aiAction === 'bio' && 'Rewrite Bio'}
            </SheetTitle>
            <SheetDescription>
              AI will generate suggestions based on your brand
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <Label>Tone</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="witty">Witty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aiResult && (
              <div className="space-y-2">
                {aiAction === 'rename' && aiResult.options?.map((opt: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAcceptAI(opt.name)}
                    className="w-full p-3 text-left rounded-xl bg-muted hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{opt.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{opt.why}</p>
                  </button>
                ))}
                
                {aiAction === 'tagline' && (
                  <div className="p-4 rounded-2xl bg-muted">
                    <p className="font-medium">{aiResult.tagline}</p>
                    {aiResult.alts?.map((alt: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          setTagline(alt);
                          setShowAISheet(false);
                        }}
                        className="block w-full text-left text-sm text-muted-foreground hover:text-foreground mt-2"
                      >
                        {alt}
                      </button>
                    ))}
                  </div>
                )}
                
                {aiAction === 'bio' && (
                  <div className="p-4 rounded-2xl bg-muted">
                    <p className="text-sm whitespace-pre-wrap">{aiResult.bio}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAIGenerate}
                disabled={aiGenerating}
                className="flex-1"
              >
                {aiGenerating ? 'Generating...' : aiResult ? 'Regenerate' : 'Generate'}
              </Button>
              {aiResult && aiAction !== 'rename' && (
                <Button onClick={() => handleAcceptAI()} variant="outline">
                  Accept
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppSurface>
  );
}

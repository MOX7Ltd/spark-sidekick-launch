import { useState, useEffect } from 'react';
import { Building2, Sparkles, Save, RotateCcw, Palette } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadPublic, generateStoragePath } from '@/lib/storage';
import { useHubBranding } from '@/hooks/useHubBranding';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface NameOption {
  name: string;
  why: string;
}

export default function ProfileBusiness() {
  const { toast } = useToast();
  const { refetch: refetchBranding } = useHubBranding();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [toneTags, setToneTags] = useState<string[]>([]);

  // Original values for revert
  const [originalData, setOriginalData] = useState({
    businessName: '',
    tagline: '',
    bio: '',
    logoUrl: '',
    toneTags: [] as string[],
  });

  // AI assist state
  const [nameOptions, setNameOptions] = useState<NameOption[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [aiAction, setAiAction] = useState<'rename' | 'tagline' | 'bio'>('rename');

  useEffect(() => {
    loadBusiness();
  }, []);

  async function loadBusiness() {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({ title: 'Error', description: 'Failed to load user', variant: 'destructive' });
        return;
      }

      setUserId(user.id);

      // Try to find existing business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bizError && bizError.code !== 'PGRST116') {
        throw bizError;
      }

      if (business) {
        setBusinessId(business.id);
        setBusinessName(business.business_name || '');
        setTagline(business.tagline || '');
        setBio(business.bio || '');
        setLogoUrl(business.logo_url || business.logo_svg || '');
        setToneTags(business.tone_tags || []);
        setOriginalData({
          businessName: business.business_name || '',
          tagline: business.tagline || '',
          bio: business.bio || '',
          logoUrl: business.logo_url || business.logo_svg || '',
          toneTags: business.tone_tags || [],
        });
      } else {
        // Create a new business row
        const { data: newBiz, error: createError } = await supabase
          .from('businesses')
          .insert({
            owner_id: user.id,
            business_name: 'My Business',
            status: 'draft',
          })
          .select()
          .single();

        if (createError) throw createError;

        setBusinessId(newBiz.id);
        setBusinessName('My Business');
      }
    } catch (error) {
      console.error('Load business error:', error);
      toast({ title: 'Error', description: 'Failed to load business', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!userId || !businessId) return;

    try {
      setIsSaving(true);

      // Upload logo if changed
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const path = generateStoragePath(userId, 'logo', logoFile);
        const { url } = await uploadPublic('brand-assets', path, logoFile);
        finalLogoUrl = url;
      }

      // Update business
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          business_name: businessName,
          tagline,
          bio,
          logo_url: logoFile?.type.includes('svg') ? null : finalLogoUrl,
          logo_svg: logoFile?.type.includes('svg') ? finalLogoUrl : null,
          tone_tags: toneTags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) throw updateError;

      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      setOriginalData({
        businessName,
        tagline,
        bio,
        logoUrl: finalLogoUrl,
        toneTags,
      });

      // Refresh Hub branding immediately
      refetchBranding();

      toast({ title: 'Saved', description: 'Your business profile has been updated.' });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save business', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  function handleRevert() {
    setBusinessName(originalData.businessName);
    setTagline(originalData.tagline);
    setBio(originalData.bio);
    setLogoUrl(originalData.logoUrl);
    setToneTags(originalData.toneTags);
    setLogoFile(null);
    toast({ title: 'Reverted', description: 'Changes discarded.' });
  }

  async function handleAIGenerate() {
    try {
      setIsGenerating(true);

      let body: any = {};
      if (aiAction === 'rename') {
        body = {
          action: 'rename_business',
          current_name: businessName,
          vibe_tags: toneTags,
        };
      } else if (aiAction === 'tagline') {
        body = {
          action: 'write_tagline',
          business_name: businessName,
          vibe_tags: toneTags,
        };
      } else if (aiAction === 'bio') {
        body = {
          action: 'rewrite_business_bio',
          current_bio: bio,
          business_name: businessName,
        };
      }

      const { data, error } = await supabase.functions.invoke('profile-assist', { body });

      if (error) throw error;

      if (aiAction === 'rename' && data?.options) {
        setNameOptions(data.options);
      } else if (aiAction === 'tagline' && data?.tagline) {
        setTagline(data.tagline);
        setSheetOpen(false);
        toast({ title: 'Generated', description: 'Tagline created. Review and save when ready.' });
      } else if (aiAction === 'bio' && data?.bio) {
        setBio(data.bio);
        setSheetOpen(false);
        toast({ title: 'Generated', description: 'Bio created. Review and save when ready.' });
      }
    } catch (error) {
      console.error('AI generate error:', error);
      toast({ title: 'Error', description: 'Failed to generate content', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }

  function selectName(name: string) {
    setBusinessName(name);
    setSheetOpen(false);
    toast({ title: 'Selected', description: 'Name updated. Save when ready.' });
  }

  const hasChanges =
    businessName !== originalData.businessName ||
    tagline !== originalData.tagline ||
    bio !== originalData.bio ||
    logoFile !== null ||
    JSON.stringify(toneTags) !== JSON.stringify(originalData.toneTags);

  if (isLoading) {
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

      {/* Header */}
      <div className="mt-4 mb-6 rounded-2xl bg-gradient-to-r from-[hsl(var(--sh-teal-600))] to-[hsl(var(--sh-orange-500))] p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Your Business</h1>
        </div>
        <p className="text-sm text-white/90">Your brand should feel like you.</p>
      </div>

      {/* Logo */}
      <div className="mb-6">
        <Label className="text-base font-semibold mb-3 block">Logo</Label>
        <ImageUploader
          value={logoUrl}
          onChange={setLogoFile}
          accept=".png,.jpg,.jpeg,.svg"
          maxSizeMB={5}
        />
      </div>

      {/* Business Name */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="businessName" className="text-base font-semibold">
            Business Name
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setAiAction('rename');
              setNameOptions([]);
              setSheetOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Rename
          </Button>
        </div>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Your business name"
          maxLength={60}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground mt-1">{businessName.length}/60</p>
      </div>

      {/* Tagline */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="tagline" className="text-base font-semibold">
            Tagline
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setAiAction('tagline');
              setSheetOpen(true);
            }}
            disabled={!businessName.trim()}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Write
          </Button>
        </div>
        <Input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One short line that captures what you do"
          maxLength={120}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground mt-1">{tagline.length}/120</p>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="bio" className="text-base font-semibold">
            About / Bio
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setAiAction('bio');
              setSheetOpen(true);
            }}
            disabled={!bio.trim()}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Rewrite
          </Button>
        </div>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Describe your business in a warm, human way."
          rows={6}
          maxLength={1000}
          className="text-base resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{bio.length}/1000</p>
      </div>

      {/* Tone Tags */}
      <div className="mb-6">
        <Label className="text-base font-semibold mb-2 block">Tone (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {['Friendly', 'Expert', 'Witty', 'Bold', 'Caring'].map((tone) => (
            <Badge
              key={tone}
              variant={toneTags.includes(tone.toLowerCase()) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                if (toneTags.includes(tone.toLowerCase())) {
                  setToneTags(toneTags.filter((t) => t !== tone.toLowerCase()));
                } else {
                  setToneTags([...toneTags, tone.toLowerCase()]);
                }
              }}
            >
              {tone}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur py-4 border-t flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex-1 bg-gradient-to-r from-[hsl(var(--sh-teal-600))] to-[hsl(var(--sh-orange-500))] hover:opacity-90"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={handleRevert} disabled={!hasChanges} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Revert
        </Button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground text-center px-4">
        <span className="font-medium text-[hsl(var(--sh-teal-600))]">Tip:</span> Your brand name should be clear, memorable, and yours.
      </p>

      {/* AI Assist Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {aiAction === 'rename' && 'Rename Business'}
              {aiAction === 'tagline' && 'Generate Tagline'}
              {aiAction === 'bio' && 'Rewrite Bio'}
            </SheetTitle>
            <SheetDescription>
              {aiAction === 'rename' && 'AI will suggest name options based on your business.'}
              {aiAction === 'tagline' && 'AI will create a compelling tagline.'}
              {aiAction === 'bio' && 'AI will rewrite your bio with a fresh voice.'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {aiAction === 'rename' && nameOptions.length > 0 ? (
              <div className="space-y-3">
                {nameOptions.map((option, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-border rounded-xl cursor-pointer hover:border-primary transition-colors"
                    onClick={() => selectName(option.name)}
                  >
                    <div className="font-semibold text-base mb-1">{option.name}</div>
                    <div className="text-sm text-muted-foreground">{option.why}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Button
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AppSurface>
  );
}

import { useState, useEffect } from 'react';
import { User, Sparkles, Save, RotateCcw } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProfileUser() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Original values for revert
  const [originalData, setOriginalData] = useState({ displayName: '', bio: '', avatarUrl: '' });

  // AI assist state
  const [aiTone, setAiTone] = useState<'friendly' | 'professional' | 'confident' | 'playful'>('friendly');
  const [aiHighlights, setAiHighlights] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({ title: 'Error', description: 'Failed to load user', variant: 'destructive' });
        return;
      }

      setUserId(user.id);

      // Try profiles table first
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const name = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || '';
      const userBio = user.user_metadata?.bio || '';
      const avatar = user.user_metadata?.avatar_url || '';

      setDisplayName(name);
      setBio(userBio);
      setAvatarUrl(avatar);
      setOriginalData({ displayName: name, bio: userBio, avatarUrl: avatar });
    } catch (error) {
      console.error('Load profile error:', error);
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!userId) return;

    try {
      setIsSaving(true);

      // Upload avatar if changed
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const path = generateStoragePath(userId, 'avatar', avatarFile);
        const { url } = await uploadPublic('avatars', path, avatarFile);
        finalAvatarUrl = url;
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: displayName,
        });

      if (profileError) throw profileError;

      // Update user metadata for bio and avatar
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          bio,
          avatar_url: finalAvatarUrl,
        },
      });

      if (updateError) throw updateError;

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setOriginalData({ displayName, bio, avatarUrl: finalAvatarUrl });

      toast({ title: 'Saved', description: 'Your profile has been updated.' });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  function handleRevert() {
    setDisplayName(originalData.displayName);
    setBio(originalData.bio);
    setAvatarUrl(originalData.avatarUrl);
    setAvatarFile(null);
    toast({ title: 'Reverted', description: 'Changes discarded.' });
  }

  async function handleAIGenerate(action: 'write' | 'improve') {
    if (!displayName.trim()) {
      toast({ title: 'Name required', description: 'Add your name first.', variant: 'destructive' });
      return;
    }

    try {
      setIsGenerating(true);

      const body = action === 'write'
        ? {
            action: 'write_user_bio',
            name: displayName,
            tone: aiTone,
            highlights: aiHighlights ? aiHighlights.split(',').map(h => h.trim()) : undefined,
          }
        : {
            action: 'improve_user_bio',
            current_bio: bio,
            tone: aiTone,
          };

      const { data, error } = await supabase.functions.invoke('profile-assist', { body });

      if (error) throw error;
      if (!data?.bio) throw new Error('No bio returned');

      setBio(data.bio);
      setSheetOpen(false);
      toast({ title: 'Generated', description: 'Bio created. Review and save when ready.' });
    } catch (error) {
      console.error('AI generate error:', error);
      toast({ title: 'Error', description: 'Failed to generate bio', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }

  const hasChanges = displayName !== originalData.displayName || 
                     bio !== originalData.bio || 
                     avatarFile !== null;

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
          <User className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>
        <p className="text-sm text-white/90">People buy from people. Keep this friendly and real.</p>
      </div>

      {/* Avatar */}
      <div className="mb-6">
        <Label className="text-base font-semibold mb-3 block">Profile Photo</Label>
        <ImageUploader
          value={avatarUrl}
          onChange={setAvatarFile}
          accept=".png,.jpg,.jpeg"
          maxSizeMB={5}
        />
      </div>

      {/* Display Name */}
      <div className="mb-6">
        <Label htmlFor="displayName" className="text-base font-semibold mb-2 block">
          Display Name
        </Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground mt-1">{displayName.length}/60</p>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="bio" className="text-base font-semibold">
            Short Bio
          </Label>
          <div className="flex gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Write Bio
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>AI Bio Writer</SheetTitle>
                  <SheetDescription>Let AI craft your bio.</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Tone</Label>
                    <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Highlights (optional, comma separated)</Label>
                    <Input
                      value={aiHighlights}
                      onChange={(e) => setAiHighlights(e.target.value)}
                      placeholder="e.g., coffee lover, designer, traveler"
                    />
                  </div>
                  <Button
                    onClick={() => handleAIGenerate('write')}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Bio'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleAIGenerate('improve')}
              disabled={!bio.trim() || isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Improve
            </Button>
          </div>
        </div>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A warm, real bio wins trust faster than a perfect one."
          rows={6}
          maxLength={600}
          className="text-base resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {bio.length}/600 · Aim for 280–600 characters
        </p>
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
        <Button
          onClick={handleRevert}
          disabled={!hasChanges}
          variant="outline"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Revert
        </Button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground text-center px-4">
        <span className="font-medium text-[hsl(var(--sh-teal-600))]">Tip:</span> A warm, real bio wins trust faster than a perfect one.
      </p>
    </AppSurface>
  );
}

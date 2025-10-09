import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ProfileUser() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Previous state for revert
  const [savedState, setSavedState] = useState({ displayName: '', bio: '', avatarUrl: '' });
  
  // AI assist state
  const [showAISheet, setShowAISheet] = useState(false);
  const [aiMode, setAiMode] = useState<'write' | 'improve'>('write');
  const [aiTone, setAiTone] = useState('friendly');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiContext, setAiContext] = useState<any>({});
  const [showContextEdit, setShowContextEdit] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Please sign in', variant: 'destructive' });
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
      setSavedState({ displayName: name, bio: userBio, avatarUrl: avatar });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({ title: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: 'Display name is required', variant: 'destructive' });
      return;
    }
    
    if (displayName.length > 60) {
      toast({ title: 'Display name must be 60 characters or less', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      
      // Upload avatar if changed
      if (avatarFile) {
        const path = generateStoragePath(userId, 'avatar', avatarFile.name);
        const { url, error } = await uploadPublic('avatars', path, avatarFile);
        if (error) {
          toast({ title: 'Avatar upload failed', description: error, variant: 'destructive' });
          setSaving(false);
          return;
        }
        finalAvatarUrl = url;
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          bio: bio,
          avatar_url: finalAvatarUrl
        }
      });

      if (authError) throw authError;

      // Try to update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: displayName
        });

      if (profileError) console.warn('Profile table update skipped:', profileError);

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setSavedState({ displayName, bio, avatarUrl: finalAvatarUrl });
      
      toast({ title: 'Profile saved successfully' });
    } catch (error) {
      console.error('Save failed:', error);
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setDisplayName(savedState.displayName);
    setBio(savedState.bio);
    setAvatarUrl(savedState.avatarUrl);
    setAvatarFile(null);
    toast({ title: 'Changes reverted' });
  };

  const handleAIGenerate = async () => {
    if (aiMode === 'improve' && !bio.trim()) {
      toast({ title: 'Enter a bio first to improve it', variant: 'destructive' });
      return;
    }

    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('profile-assist', {
        body: {
          action: aiMode === 'write' ? 'write_user_bio' : 'improve_user_bio',
          payload: {
            user_id: userId,
            name: displayName,
            current_bio: bio,
            tone: aiTone,
            context: showContextEdit ? aiContext : undefined
          }
        }
      });

      if (error) throw error;
      
      setAiResult(data.bio);
      toast({ title: 'Bio generated successfully' });
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({ title: 'AI assist failed', description: String(error), variant: 'destructive' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAcceptAI = () => {
    setBio(aiResult);
    setShowAISheet(false);
    setAiResult('');
    toast({ title: 'Bio updated' });
  };

  const openAISheet = async (mode: 'write' | 'improve') => {
    setAiMode(mode);
    setAiResult('');
    setShowContextEdit(false);
    
    // Load onboarding context
    if (userId) {
      try {
        const { data: business } = await supabase
          .from('businesses')
          .select('business_name, tagline')
          .eq('owner_id', userId)
          .maybeSingle();

        // Fetch from onboarding_sessions
        const { data: session } = await supabase
          .from('onboarding_sessions')
          .select('payload')
          .eq('migrated_to_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let aboutYou: any = {};
        if (session?.payload) {
          aboutYou = (session.payload as any).formData?.aboutYou || (session.payload as any).aboutYou || {};
        }

        setAiContext({
          expertise: aboutYou?.expertise || '',
          motivation: aboutYou?.motivation || '',
          business_name: business?.business_name || '',
          tagline: business?.tagline || ''
        });
      } catch (error) {
        console.error('Failed to load context:', error);
      }
    }
    
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
        icon={<User className="h-5 w-5" />}
        title="Your Profile"
        subtitle="People buy from people. Keep this friendly and real."
      />

      <div className="mt-6 space-y-6">
        {/* Avatar */}
        <div>
          <Label>Profile Photo</Label>
          <div className="mt-2">
            <ImageUploader
              value={avatarUrl}
              onChange={setAvatarFile}
              accept=".png,.jpg,.jpeg"
            />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">{displayName.length}/60 characters</p>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio">Short Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself..."
            rows={4}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {bio.length} characters · Aim for 280–600 for best results
          </p>
          <p className="text-xs text-[hsl(var(--sh-teal-600))] mt-2">
            A warm, real bio wins trust faster than a perfect one.
          </p>
        </div>

        {/* AI Assist */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => openAISheet('write')}
            disabled={!displayName.trim()}
          >
            Write my bio
          </Button>
          <Button
            variant="outline"
            onClick={() => openAISheet('improve')}
            disabled={!bio.trim()}
          >
            Improve bio
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

      <p className="text-xs text-center text-muted-foreground pb-4">
        Small steps → big trust.
      </p>

      {/* AI Assist Sheet */}
      <Sheet open={showAISheet} onOpenChange={setShowAISheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{aiMode === 'write' ? 'Write My Bio' : 'Improve My Bio'}</SheetTitle>
            <SheetDescription>
              {aiMode === 'write' 
                ? 'AI will craft a bio based on your tone preference' 
                : 'AI will enhance your current bio'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {(aiContext.expertise || aiContext.motivation) && (
              <Accordion type="single" collapsible defaultValue="context">
                <AccordionItem value="context">
                  <AccordionTrigger className="text-sm">
                    Using your onboarding info
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      {aiContext.expertise && (
                        <div>
                          <span className="font-medium">Expertise:</span>
                          {showContextEdit ? (
                            <Textarea
                              value={aiContext.expertise}
                              onChange={(e) => setAiContext({...aiContext, expertise: e.target.value})}
                              className="mt-1"
                              rows={2}
                            />
                          ) : (
                            <p className="text-muted-foreground mt-1">{aiContext.expertise}</p>
                          )}
                        </div>
                      )}
                      {aiContext.motivation && (
                        <div>
                          <span className="font-medium">Motivation:</span>
                          {showContextEdit ? (
                            <Textarea
                              value={aiContext.motivation}
                              onChange={(e) => setAiContext({...aiContext, motivation: e.target.value})}
                              className="mt-1"
                              rows={2}
                            />
                          ) : (
                            <p className="text-muted-foreground mt-1">{aiContext.motivation}</p>
                          )}
                        </div>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setShowContextEdit(!showContextEdit)}
                      >
                        {showContextEdit ? 'Done editing' : 'Edit details for this draft only'}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <div>
              <Label>Tone</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger className="mt-2">
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

            {aiResult && (
              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-muted">
                  <p className="text-sm whitespace-pre-wrap">{aiResult}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  No placeholders should appear. If you see blanks, tap Regenerate.
                </p>
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
              {aiResult && (
                <Button onClick={handleAcceptAI} variant="outline">
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

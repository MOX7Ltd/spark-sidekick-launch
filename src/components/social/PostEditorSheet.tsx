import { useState, useEffect } from 'react';
import { X, Copy, Wand2, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MediaPicker } from './MediaPicker';
import { PLATFORM_ICONS } from '@/lib/platforms';
import { getCharCount, getHashtagCount, enforceLimits } from '@/lib/postRules';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  notes?: string;
}

interface PostData {
  id: string;
  campaign_id: string;
  campaign_name?: string;
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[];
  status: 'draft' | 'ready' | 'scheduled' | 'posted';
  scheduled_at?: string | null;
  posted_at?: string | null;
  meta?: {
    media_assets?: MediaAsset[];
    revisions?: any[];
    deleted_at?: string | null;
    scheduled_at?: string | null;
  };
}

interface PostEditorSheetProps {
  post: PostData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PostEditorSheet({ post, open, onOpenChange, onSaved }: PostEditorSheetProps) {
  const [hook, setHook] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [status, setStatus] = useState<'draft' | 'ready' | 'scheduled' | 'posted'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setHook(post.hook || '');
      setCaption(post.caption || '');
      setHashtags((post.hashtags || []).join(', '));
      setStatus(post.status);
      setScheduledAt(post.scheduled_at || post.meta?.scheduled_at || '');
      setMediaAssets(post.meta?.media_assets || []);
    } else {
      setHook('');
      setCaption('');
      setHashtags('');
      setStatus('draft');
      setScheduledAt('');
      setMediaAssets([]);
    }
  }, [post]);

  if (!post) return null;

  const platform = post.platform;
  const charStats = getCharCount(platform, caption);
  const hashtagsArray = hashtags.split(/[,\s]+/).filter(h => h.trim());
  const hashtagStats = getHashtagCount(platform, hashtagsArray);

  const handleImproveCaption = async () => {
    setIsImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-post-tools', {
        body: {
          action: 'improve_post',
          platform,
          hook,
          caption,
          hashtags: hashtagsArray
        }
      });

      if (error) throw error;

      if (data?.hook) setHook(data.hook);
      if (data?.caption) setCaption(data.caption);
      if (data?.hashtags) setHashtags(data.hashtags.join(', '));

      toast({ title: 'Caption improved!' });
    } catch (error: any) {
      console.error('[PostEditor] Improve error:', error);
      toast({
        title: 'Failed to improve',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleSuggestHashtags = async () => {
    setIsImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-post-tools', {
        body: {
          action: 'improve_post',
          platform,
          hook,
          caption,
          hashtags: []
        }
      });

      if (error) throw error;
      if (data?.hashtags) setHashtags(data.hashtags.join(', '));

      toast({ title: 'Hashtags suggested!' });
    } catch (error: any) {
      console.error('[PostEditor] Suggest hashtags error:', error);
      toast({
        title: 'Failed to suggest hashtags',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopy = () => {
    const text = `${hook}\n\n${caption}\n\n${hashtagsArray.join(' ')}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Store previous values for version history
      const previous = {
        hook: post.hook,
        caption: post.caption,
        hashtags: post.hashtags,
        status: post.status,
        scheduled_at: post.scheduled_at
      };

      const revisions = [...(post.meta?.revisions || []), {
        ts: new Date().toISOString(),
        previous
      }];

      const { error } = await supabase
        .from('campaign_items')
        .update({
          hook,
          caption,
          hashtags: hashtagsArray,
          status,
          scheduled_at: scheduledAt || null,
          posted_at: status === 'posted' ? new Date().toISOString() : post.posted_at,
          meta: {
            ...(post.meta || {}),
            media_assets: mediaAssets as any,
            revisions: revisions as any,
            scheduled_at: scheduledAt || null
          } as any
        })
        .eq('id', post.id);

      if (error) throw error;

      toast({ title: 'Post saved!' });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[PostEditor] Save error:', error);
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]}</span>
            <span>Edit Post</span>
          </SheetTitle>
          {post.campaign_name && (
            <p className="text-sm text-muted-foreground">{post.campaign_name}</p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hook */}
          <div className="space-y-2">
            <Label htmlFor="hook">Hook</Label>
            <Input
              id="hook"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Attention-grabbing first line..."
            />
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="caption">Caption</Label>
              <span className={`text-xs ${charStats.percent > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charStats.current} / {charStats.max}
              </span>
            </div>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption here..."
              rows={6}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImproveCaption}
                disabled={isImproving}
              >
                <Wand2 className="h-3 w-3 mr-1" />
                Improve
              </Button>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hashtags">Hashtags</Label>
              <span className={`text-xs ${hashtagStats.isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                {hashtagStats.current} / {hashtagStats.max}
              </span>
            </div>
            <Textarea
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#hashtag1, #hashtag2, #hashtag3"
              rows={2}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSuggestHashtags}
              disabled={isImproving}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Suggest
            </Button>
          </div>

          {/* Media */}
          <div className="space-y-2">
            <Label>Media</Label>
            <MediaPicker
              assets={mediaAssets}
              onChange={setMediaAssets}
              campaignId={post.campaign_id}
              itemId={post.id}
            />
          </div>

          {/* Scheduling */}
          {(status === 'scheduled' || scheduledAt) && (
            <div className="space-y-2">
              <Label htmlFor="scheduled">Schedule For</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-primary text-primary-foreground"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

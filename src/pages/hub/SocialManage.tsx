import { useEffect, useState } from 'react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { UI_PLATFORMS, PLATFORM_ICONS, UiPlatform } from '@/lib/platforms';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Item = {
  id: string;
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[] | null;
  status: string;
  campaign_name?: string;
};

export default function SocialManage() {
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'ready'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id);

      if (!businesses || businesses.length === 0) {
        setItems([]);
        return;
      }

      const businessIds = businesses.map(b => b.id);

      // Get campaigns for these businesses
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name')
        .in('business_id', businessIds);

      if (!campaigns || campaigns.length === 0) {
        setItems([]);
        return;
      }

      const campaignIds = campaigns.map(c => c.id);
      const campaignMap = new Map(campaigns.map(c => [c.id, c.name || 'Untitled Campaign']));

      // Get campaign items
      const { data: campaignItems, error } = await supabase
        .from('campaign_items')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems((campaignItems || []).map(item => ({
        id: item.id,
        platform: item.platform || 'unknown',
        hook: item.hook || '',
        caption: item.caption || '',
        hashtags: item.hashtags,
        status: 'draft', // Default to draft for now
        campaign_name: campaignMap.get(item.campaign_id)
      })));
    } catch (error: any) {
      console.error('[SocialManage] Error loading items:', error);
      toast({
        title: 'Failed to load posts',
        description: error.message || 'Could not load your campaign posts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const okStatus = statusFilter === 'all' || item.status === statusFilter;
    const okPlatform = platformFilter === 'all' || item.platform === platformFilter;
    return okStatus && okPlatform;
  });

  const copyPost = (item: Item) => {
    const text = `${item.hook}\n\n${item.caption}\n\n${(item.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <AppSurface>
      <BackBar to="/hub/social" label="Back to Social" />
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-foreground">Manage Posts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your campaign posts
        </p>
      </div>

      {/* Status filters */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {(['all', 'draft', 'ready'] as const).map(status => (
          <Button
            key={status}
            onClick={() => setStatusFilter(status)}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Platform filters */}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
        <Button
          onClick={() => setPlatformFilter('all')}
          variant={platformFilter === 'all' ? 'default' : 'outline'}
          size="sm"
        >
          All platforms
        </Button>
        {UI_PLATFORMS.map(platform => (
          <Button
            key={platform}
            onClick={() => setPlatformFilter(platform)}
            variant={platformFilter === platform ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
          >
            <span>{PLATFORM_ICONS[platform]}</span>
            <span className="capitalize">{platform}</span>
          </Button>
        ))}
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="mt-8 text-center text-muted-foreground">
          Loading posts...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            {items.length === 0 
              ? 'No posts yet. Create some in Social Lab or complete onboarding.'
              : 'No posts match your filters.'}
          </p>
          {items.length === 0 && (
            <Button onClick={() => window.location.href = '/hub/social/lab'}>
              Go to Social Lab
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredItems.map(item => (
            <div key={item.id} className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-4 transition-all hover:border-border">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="gap-1">
                  <span>{PLATFORM_ICONS[item.platform as UiPlatform]}</span>
                  <span className="capitalize">{item.platform}</span>
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.status}
                </Badge>
              </div>
              
              <div className="mb-2">
                <p className="font-medium text-foreground">{item.hook}</p>
                {item.campaign_name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Campaign: {item.campaign_name}
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {item.caption}
              </p>

              {item.hashtags && item.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.hashtags.slice(0, 5).map((tag, i) => (
                    <span key={i} className="text-xs font-mono text-primary">
                      {tag}
                    </span>
                  ))}
                  {item.hashtags.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{item.hashtags.length - 5} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => copyPost(item)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy text
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppSurface>
  );
}

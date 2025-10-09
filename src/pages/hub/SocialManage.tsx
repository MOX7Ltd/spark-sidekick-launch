import { useEffect, useState } from 'react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { UI_PLATFORMS, PLATFORM_ICONS, UiPlatform } from '@/lib/platforms';
import { Copy, Edit, Search, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PostEditorSheet } from '@/components/social/PostEditorSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Item = {
  id: string;
  campaign_id: string;
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[] | null;
  status: 'draft' | 'ready' | 'scheduled' | 'posted';
  scheduled_at?: string | null;
  posted_at?: string | null;
  campaign_name?: string;
  meta?: any;
};

export default function SocialManage() {
  const [items, setItems] = useState<Item[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'ready' | 'scheduled' | 'posted'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Item | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
        campaign_id: item.campaign_id,
        platform: item.platform || 'unknown',
        hook: item.hook || '',
        caption: item.caption || '',
        hashtags: item.hashtags,
        status: (item as any).status || 'draft',
        scheduled_at: item.scheduled_at,
        posted_at: item.posted_at,
        campaign_name: campaignMap.get(item.campaign_id),
        meta: (item as any).meta
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
    // Don't show deleted items
    if (item.meta?.deleted_at) return false;

    const okStatus = statusFilter === 'all' || item.status === statusFilter;
    const okPlatform = platformFilter === 'all' || item.platform === platformFilter;
    const okSearch = !searchQuery || 
      item.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption.toLowerCase().includes(searchQuery.toLowerCase());
    
    return okStatus && okPlatform && okSearch;
  });

  const copyPost = (item: Item) => {
    const text = `${item.hook}\n\n${item.caption}\n\n${(item.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleEdit = (item: Item) => {
    setEditingPost(item);
    setIsEditorOpen(true);
  };

  const handleStatusChange = async (itemId: string, newStatus: 'draft' | 'ready' | 'scheduled' | 'posted') => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'posted') {
        updates.posted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('campaign_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      toast({ title: `Marked as ${newStatus}` });
      loadItems();
    } catch (error: any) {
      console.error('[SocialManage] Status update error:', error);
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSoftDelete = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      const { error } = await supabase
        .from('campaign_items')
        .update({
          meta: {
            ...(item?.meta || {}),
            deleted_at: new Date().toISOString()
          }
        })
        .eq('id', itemId);

      if (error) throw error;

      toast({ title: 'Post deleted' });
      loadItems();
    } catch (error: any) {
      console.error('[SocialManage] Delete error:', error);
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <AppSurface>
      <BackBar to="/hub/social" label="Back to Social" />
      
      {/* Header with gradient */}
      <div className="mt-4 rounded-2xl bg-gradient-primary p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold">Manage Posts</h1>
        <p className="text-sm mt-1 opacity-90">
          Small steps snowball into sales. 🎯
        </p>
      </div>

      {/* Search */}
      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by hook or caption..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filters */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {(['all', 'draft', 'ready', 'scheduled', 'posted'] as const).map(status => (
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
            <div key={item.id} className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm p-4 transition-all hover:border-border hover:shadow-brand-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <span>{PLATFORM_ICONS[item.platform as UiPlatform]}</span>
                    <span className="capitalize">{item.platform}</span>
                  </Badge>
                  <Badge 
                    variant={
                      item.status === 'posted' ? 'default' : 
                      item.status === 'ready' ? 'secondary' : 
                      'outline'
                    }
                    className="text-xs"
                  >
                    {item.status}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {item.status !== 'ready' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'ready')}>
                        Mark Ready
                      </DropdownMenuItem>
                    )}
                    {item.status !== 'posted' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'posted')}>
                        Mark Posted
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleSoftDelete(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  onClick={() => handleEdit(item)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => copyPost(item)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Sheet */}
      <PostEditorSheet
        post={editingPost}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSaved={loadItems}
      />
    </AppSurface>
  );
}

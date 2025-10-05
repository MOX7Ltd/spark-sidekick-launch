import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PostPreviewCard } from './PostPreviewCard';
import { Search } from 'lucide-react';

interface SavedPost {
  id: string;
  platform: string;
  post_text: string;
  hashtags: string[];
  image_url?: string;
  created_at: string;
}

interface SavedPostsGalleryProps {
  posts: SavedPost[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavedPost>) => void;
}

export const SavedPostsGallery = ({ posts, onDelete, onUpdate }: SavedPostsGalleryProps) => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.post_text.toLowerCase().includes(search.toLowerCase()) ||
      post.hashtags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const platforms = Array.from(new Set(posts.map(p => p.platform)));

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No saved posts yet.</p>
        <p className="text-sm mt-2">Generate and save posts to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {platforms.map(platform => (
              <SelectItem key={platform} value={platform} className="capitalize">
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No posts match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostPreviewCard
              key={post.id}
              id={post.id}
              platform={post.platform}
              postText={post.post_text}
              hashtags={post.hashtags}
              imageUrl={post.image_url}
              onDelete={onDelete}
              onSave={(updates) => onUpdate(post.id, {
                post_text: updates.postText,
                hashtags: updates.hashtags,
                image_url: updates.imageUrl
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

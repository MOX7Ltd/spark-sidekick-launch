import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostCard, Post } from './PostCard';
import { ThumbsDown } from 'lucide-react';
import { Platform } from '@/lib/socialLab';

export interface CampaignConcept {
  id: string;
  title: string;
  promise: string;
  cadence: { days: number; posts: number };
  key_messages: string[];
  suggested_platforms: string[];
  posts_by_platform: Record<string, Post[]>;
}

interface CampaignConceptCardProps {
  concept: CampaignConcept;
  selectedPlatforms: Platform[];
  onAddToCampaign: (post: Post) => void;
  onMoreLikeThis: (conceptId: string) => void;
  onMoreLikeThisPost: (post: Post) => void;
  onReject: (conceptId: string) => void;
  onRejectPost: (post: Post) => void;
}

export function CampaignConceptCard({
  concept,
  selectedPlatforms,
  onAddToCampaign,
  onMoreLikeThis,
  onMoreLikeThisPost,
  onReject,
  onRejectPost
}: CampaignConceptCardProps) {
  const [showPosts, setShowPosts] = useState(false);

  return (
    <Card className="p-6 bg-background/60 backdrop-blur-md border-2">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-0">
                Concept
              </Badge>
            </div>
            <h3 className="text-xl font-bold mb-1">{concept.title}</h3>
            <p className="text-muted-foreground">{concept.promise}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{concept.cadence.days} days</span>
          <span>•</span>
          <span>{concept.cadence.posts} posts</span>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Key messages</p>
          <ul className="space-y-1">
            {concept.key_messages.map((msg, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span>•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>

        {concept.suggested_platforms && concept.suggested_platforms.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Suggested platforms</p>
            <div className="flex flex-wrap gap-1">
              {concept.suggested_platforms.map((platform) => (
                <Badge key={platform} variant="outline" className="text-xs">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => setShowPosts(!showPosts)}
            variant="default"
            className="flex-1"
          >
            {showPosts ? 'Hide posts' : 'Open posts'}
          </Button>
          <Button
            onClick={() => onMoreLikeThis(concept.id)}
            variant="outline"
          >
            More like this
          </Button>
          <Button
            onClick={() => onReject(concept.id)}
            variant="ghost"
            size="icon"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>

        {showPosts && (
          <div className="space-y-4 pt-4 border-t">
            {selectedPlatforms.map((platform) => {
              const posts = concept.posts_by_platform[platform] || [];
              if (posts.length === 0) return null;

              return (
                <div key={platform} className="space-y-3">
                  <h4 className="font-medium capitalize">{platform}</h4>
                  {posts.map((post, i) => (
                    <PostCard
                      key={`${platform}-${i}`}
                      post={post}
                      onAddToCampaign={onAddToCampaign}
                      onMoreLikeThis={onMoreLikeThisPost}
                      onReject={onRejectPost}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

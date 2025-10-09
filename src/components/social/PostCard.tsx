import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PLATFORM_ICONS, PLATFORM_LIMITS, UiPlatform } from '@/lib/platforms';
import { Copy, ThumbsDown, Plus, Image, Video, Layers } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface Post {
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[];
  media_guide?: {
    idea?: string;
    video_beats?: string[];
    carousel?: string[];
    specs?: string[];
  };
}

interface PostCardProps {
  post: Post;
  onAddToCampaign: (post: Post) => void;
  onMoreLikeThis: (post: Post) => void;
  onReject: (post: Post) => void;
}

export function PostCard({ post, onAddToCampaign, onMoreLikeThis, onReject }: PostCardProps) {
  const [showMedia, setShowMedia] = useState(false);
  const platform = post.platform as UiPlatform;
  const limits = PLATFORM_LIMITS[platform];

  const copyText = () => {
    const text = `${post.hook}\n\n${post.caption}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const charCount = post.caption.length;
  const isNearLimit = limits && charCount > limits.captionMax * 0.9;

  return (
    <Card className="p-4 bg-background/60 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <Badge variant="outline" className="gap-1">
          <span>{PLATFORM_ICONS[platform]}</span>
          {platform}
        </Badge>
        {limits && (
          <span className={`text-xs ${isNearLimit ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {charCount}/{limits.captionMax}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Hook</p>
          <p className="font-medium">{post.hook}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Caption</p>
          <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
        </div>

        {post.hashtags && post.hashtags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Hashtags</p>
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((tag, i) => (
                <span key={i} className="text-xs font-mono text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {post.media_guide && (
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMedia(!showMedia)}
              className="w-full justify-start"
            >
              {showMedia ? '▼' : '▶'} Media guidance
            </Button>
            {showMedia && (
              <div className="mt-2 space-y-2 text-sm">
                {post.media_guide.idea && (
                  <div className="flex gap-2">
                    <Image className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Idea</p>
                      <p className="text-muted-foreground">{post.media_guide.idea}</p>
                    </div>
                  </div>
                )}
                {post.media_guide.video_beats && post.media_guide.video_beats.length > 0 && (
                  <div className="flex gap-2">
                    <Video className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Video beats</p>
                      <ul className="text-muted-foreground list-disc list-inside">
                        {post.media_guide.video_beats.map((beat, i) => (
                          <li key={i}>{beat}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {post.media_guide.carousel && post.media_guide.carousel.length > 0 && (
                  <div className="flex gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Carousel slides</p>
                      <ul className="text-muted-foreground list-disc list-inside">
                        {post.media_guide.carousel.map((slide, i) => (
                          <li key={i}>{slide}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {post.media_guide.specs && post.media_guide.specs.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium">Specs</p>
                    <p>{post.media_guide.specs.join(' · ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => onAddToCampaign(post)}
          className="flex-1 bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:opacity-90"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add to Campaign
        </Button>
        <Button onClick={copyText} variant="outline" size="sm">
          <Copy className="h-4 w-4" />
        </Button>
        <Button onClick={() => onMoreLikeThis(post)} variant="ghost" size="sm">
          More
        </Button>
        <Button onClick={() => onReject(post)} variant="ghost" size="sm">
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

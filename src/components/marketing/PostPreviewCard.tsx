import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Edit, Save, X, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PostPreviewCardProps {
  id?: string;
  platform: string;
  postText: string;
  hashtags: string[];
  imageUrl?: string;
  isNew?: boolean;
  onSave?: (post: { platform: string; postText: string; hashtags: string[]; imageUrl?: string }) => void;
  onDelete?: (id: string) => void;
  onFeedback?: (feedback: 'up' | 'down') => void;
  onRegenerate?: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-500',
  twitter: 'bg-sky-500',
  tiktok: 'bg-black',
};

export const PostPreviewCard = ({
  id,
  platform,
  postText: initialPostText,
  hashtags: initialHashtags,
  imageUrl,
  isNew = false,
  onSave,
  onDelete,
  onFeedback,
  onRegenerate
}: PostPreviewCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [postText, setPostText] = useState(initialPostText);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const { toast } = useToast();

  const handleSave = () => {
    if (onSave) {
      onSave({ platform, postText, hashtags, imageUrl });
      setIsEditing(false);
    }
  };

  const handleCopy = () => {
    const fullText = `${postText}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    toast({
      title: "Copied to clipboard",
      description: "Post text and hashtags have been copied.",
    });
  };

  return (
    <Card className="overflow-hidden animate-fade-in">
      {imageUrl && (
        <div className="relative h-48 bg-muted">
          <img
            src={imageUrl}
            alt="Post preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-4 space-y-3">
        {/* Platform badge */}
        <div className="flex items-center justify-between">
          <Badge 
            className={`${PLATFORM_COLORS[platform.toLowerCase()] || 'bg-primary'} text-white capitalize`}
          >
            {platform}
          </Badge>
          {isNew && (
            <Badge variant="outline" className="text-primary">
              New
            </Badge>
          )}
        </div>

        {/* Post text */}
        {isEditing ? (
          <Textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="min-h-32 resize-none"
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {postText}
          </p>
        )}

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {isEditing ? (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPostText(initialPostText);
                  setHashtags(initialHashtags);
                  setIsEditing(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              {isNew && onFeedback && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback('up')}
                    className="gap-1.5"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback('down')}
                    className="gap-1.5"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              {isNew && onSave && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onSave({ platform, postText, hashtags, imageUrl })}
                  className="ml-auto"
                >
                  Save to Gallery
                </Button>
              )}
              {!isNew && id && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(id)}
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

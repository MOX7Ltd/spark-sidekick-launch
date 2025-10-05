import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { MarketingChatPanel } from '@/components/marketing/MarketingChatPanel';
import { PostPreviewCard } from '@/components/marketing/PostPreviewCard';
import { SavedPostsGallery } from '@/components/marketing/SavedPostsGallery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SkeletonGrid } from '@/components/hub/SkeletonCard';
import { MicroGuidance } from '@/components/hub/MicroGuidance';
import { EmptyState } from '@/components/hub/EmptyState';
import { MessageSquare } from 'lucide-react';

interface GeneratedPost {
  platform: string;
  postText: string;
  hashtags: string[];
  imageUrl?: string;
}

interface SavedPost {
  id: string;
  platform: string;
  post_text: string;
  hashtags: string[];
  image_url?: string;
  created_at: string;
}

export default function Marketing() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('marketing_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPosts(data || []);
    } catch (error) {
      console.error('Error loading saved posts:', error);
      toast({
        title: "Failed to load posts",
        description: "Could not load your saved posts.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleGenerate = async (prompt: string, platforms: string[]) => {
    setIsGenerating(true);
    try {
      // Mock generation for demo - in production, call generate-campaign edge function
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockPosts: GeneratedPost[] = platforms.map(platform => ({
        platform,
        postText: `🚀 Exciting news! ${prompt}\n\nDiscover how this can transform your workflow. Limited time offer - don't miss out!`,
        hashtags: ['entrepreneur', 'productivity', 'success', 'business'],
        imageUrl: undefined
      }));

      setGeneratedPosts(mockPosts);
      
      toast({
        title: "Posts generated!",
        description: `Created ${mockPosts.length} posts for your review.`,
      });
    } catch (error) {
      console.error('Error generating posts:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePost = async (post: GeneratedPost) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('marketing_posts')
        .insert({
          user_id: user.id,
          platform: post.platform,
          post_text: post.postText,
          hashtags: post.hashtags,
          image_url: post.imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      setSavedPosts(prev => [data, ...prev]);
      setGeneratedPosts(prev => prev.filter(p => p !== post));
      
      toast({
        title: "Post saved",
        description: "Added to your gallery.",
      });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Save failed",
        description: "Could not save the post.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('marketing_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedPosts(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Post deleted",
        description: "Removed from your gallery.",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the post.",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePost = async (id: string, updates: Partial<SavedPost>) => {
    try {
      const { error } = await supabase
        .from('marketing_posts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setSavedPosts(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ));
      
      toast({
        title: "Post updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Update failed",
        description: "Could not update the post.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Marketing"
        subtitle="Generate posts and grow your audience across all platforms."
      />

      <MicroGuidance text="These posts will help you reach your first customers — let's make some magic! 🎯" />

      {/* Chat and generation panel */}
      <div className="space-y-6">
        <MarketingChatPanel
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* Generated posts */}
        {generatedPosts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generated Posts
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {generatedPosts.map((post, i) => (
                <PostPreviewCard
                  key={i}
                  platform={post.platform}
                  postText={post.postText}
                  hashtags={post.hashtags}
                  imageUrl={post.imageUrl}
                  isNew
                  onSave={() => handleSavePost(post)}
                  onFeedback={(feedback) => console.log('Feedback:', feedback)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved posts gallery */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Saved Posts</h3>
        {isLoadingSaved ? (
          <SkeletonGrid count={4} />
        ) : savedPosts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No saved posts yet"
            description="Generate your first marketing campaign above and save your favorite posts here."
          />
        ) : (
          <SavedPostsGallery
            posts={savedPosts}
            onDelete={handleDeletePost}
            onUpdate={handleUpdatePost}
          />
        )}
      </div>
    </div>
  );
}

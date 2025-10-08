import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Instagram, Linkedin, ArrowRight, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateCampaign } from '@/lib/api';
import { saveOnboardingSession } from '@/lib/onboardingSession';
import type { BrandContext } from '@/types/brand';
import type { ProductIdea, AboutYou } from '@/types/onboarding';

interface SocialPostPreviewProps {
  aboutYou: AboutYou;
  vibes: string[];
  audiences: string[];
  businessIdentity: {
    name: string;
    tagline?: string;
    logo?: string;
  };
  products: ProductIdea[];
  onContinue: () => void;
}

export const SocialPostPreview = ({ 
  aboutYou,
  vibes,
  audiences,
  businessIdentity,
  products,
  onContinue 
}: SocialPostPreviewProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [shortPost, setShortPost] = useState<{ caption: string; hashtags: string[] } | null>(null);
  const [longPost, setLongPost] = useState<{ caption: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    generatePosts();
  }, []);

  const generatePosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build the name to use based on user preferences
      let displayName = '';
      if (aboutYou.includeFirstName && aboutYou.includeLastName) {
        displayName = `${aboutYou.firstName} ${aboutYou.lastName}`;
      } else if (aboutYou.includeFirstName) {
        displayName = aboutYou.firstName;
      } else if (aboutYou.includeLastName) {
        displayName = aboutYou.lastName;
      }
      
      // Build BrandContext from props
      const context: BrandContext = {
        idea_text: '',
        business_name: businessIdentity.name,
        bio: aboutYou.expertise,
        palette: [],
        tone_adjectives: vibes,
        audience: audiences,
        vibes,
        audiences,
        user_first_name: aboutYou.firstName,
        user_last_name: aboutYou.lastName,
        expertise: aboutYou.expertise,
        motivation: aboutYou.motivation || aboutYou.expertise,
        personal_brand: aboutYou.includeFirstName || aboutYou.includeLastName,
      };
      
      const response = await generateCampaign(context, products.slice(0, 3));

      console.log('Campaign response:', response);
      
      if (response.items && response.items.length >= 2) {
        const short = response.items.find(item => item.hook === 'Short Version');
        const long = response.items.find(item => item.hook === 'Long Version');
        
        if (short) {
          setShortPost({ 
            caption: short.caption, 
            hashtags: short.hashtags || [] 
          });
        }
        
        if (long) {
          setLongPost({ caption: long.caption });
        }
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Error generating posts:', err);
      setError('Failed to generate posts. Please try again.');
      toast({
        title: "Generation failed",
        description: "We couldn't generate your posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await generatePosts();
    setIsRegenerating(false);
    toast({
      title: "Posts refreshed!",
      description: "Your social posts have been regenerated",
    });
  };
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h2 className="text-2xl font-bold">Creating your story...</h2>
          <p className="text-muted-foreground">This will just take a moment</p>
        </div>
      </div>
    );
  }

  if (error || !shortPost || !longPost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'Something went wrong'}</p>
          <Button onClick={generatePosts}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="text-center mb-6 md:mb-8 space-y-2 md:space-y-3">
        <p className="text-xs md:text-sm text-muted-foreground/70 uppercase tracking-wide mb-2 md:mb-3 px-4">
          Your shopfront is live — now let's spread the word and attract your first customers.
        </p>
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full mb-2 md:mb-4 animate-bounce-in">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary animate-glow-pulse" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold px-2">📣 Let's Spread the Word!</h2>
        <p className="text-base md:text-lg text-muted-foreground px-4">
          These posts are your ticket to attracting your first customers. Copy, tweak, and share today.
        </p>
        <p className="text-sm md:text-base text-muted-foreground/80 italic px-4 pt-2">
          Thousands of new side-hustlers launched their business here — now it's your turn.
        </p>
      </div>

      <div className="space-y-6">
        {/* Instagram-style short post */}
        <Card className="border-2 border-primary/20 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
              <Instagram className="w-5 h-5 text-pink-500" />
              <span className="font-semibold">Quick Launch Post</span>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full ml-auto">Instagram</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {shortPost.caption}
              </p>
              <div className="flex flex-wrap gap-2">
                {shortPost.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs text-primary font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Perfect for Instagram, Facebook, or Twitter
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`${shortPost.caption}\n\n${shortPost.hashtags.join(' ')}`, 'Quick Launch Post')}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LinkedIn-style long post */}
        <Card className="border-2 border-primary/20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Your Origin Story</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-auto">LinkedIn</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {longPost.caption}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Great for LinkedIn or a blog post
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(longPost.caption, 'Origin Story Post')}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-dashed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">These are just starting points!</strong> You can customize, edit, and refine them anytime in your dashboard. They're designed to feel authentic and personal – just like your business.
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate Posts'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 md:mt-8 text-center">
        <Button 
          size="lg"
          variant="hero"
          onClick={async () => {
            // Save onboarding session before continuing
            const context: BrandContext = {
              idea_text: '',
              business_name: businessIdentity.name,
              bio: aboutYou.expertise,
              palette: [],
              tone_adjectives: vibes,
              audience: audiences,
              vibes,
              audiences,
              user_first_name: aboutYou.firstName,
              user_last_name: aboutYou.lastName,
              expertise: aboutYou.expertise,
              motivation: aboutYou.motivation || aboutYou.expertise,
              personal_brand: aboutYou.includeFirstName || aboutYou.includeLastName,
            };
            
            await saveOnboardingSession({
              formData: { aboutYou, vibes, audiences, businessIdentity, products },
              context,
              generatedPosts: [
                ...(shortPost ? [{ ...shortPost, platform: 'Instagram', hook: 'Short Version' }] : []),
                ...(longPost ? [{ ...longPost, platform: 'LinkedIn', hook: 'Long Version' }] : [])
              ],
            });
            
            onContinue();
          }}
          className="w-full md:w-auto h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-semibold group"
        >
          Continue to Launch
          <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
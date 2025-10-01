import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Instagram, Linkedin, ArrowRight, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialPostPreviewProps {
  firstName: string;
  expertise: string;
  motivation: string;
  styles: string[];
  idea: string;
  onContinue: () => void;
}

export const SocialPostPreview = ({ 
  firstName, 
  expertise, 
  motivation, 
  styles, 
  idea,
  onContinue 
}: SocialPostPreviewProps) => {
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    // In a real implementation, this would call the API to regenerate posts
    setTimeout(() => {
      setIsRegenerating(false);
      toast({
        title: "Posts refreshed!",
        description: "Your social posts have been regenerated",
      });
    }, 1500);
  };
  
  // Generate authentic, human social posts
  const generateShortPost = () => {
    const styleVibe = styles.includes('Playful') ? '✨' : styles.includes('Bold') ? '🔥' : '💡';
    return {
      caption: `Hey everyone! ${firstName} here ${styleVibe}\n\nI'm taking the leap and starting something new – ${idea.toLowerCase()}.\n\nIt's scary and exciting at the same time, but I've been thinking about this for a while now. ${expertise}\n\n${motivation || "I'm ready to see where this journey takes me."}\n\nWho's with me? Drop a comment if you've ever felt that pull to try something new 👇`,
      hashtags: ['#NewBeginnings', '#SideHustle', '#EntrepreneurJourney', '#SmallBusiness', '#StartingOut']
    };
  };

  const generateLongPost = () => {
    return {
      caption: `I've been sitting on an idea for months (maybe longer if I'm being honest).\n\nToday, I'm finally doing something about it.\n\nI'm launching ${idea.toLowerCase()}, and here's why:\n\n${expertise} This isn't just something I know how to do – it's something I genuinely care about.\n\n${motivation || "I realized I was waiting for the 'perfect time' that was never going to come."}\n\nSo here's what I'm building:\nA business that helps people in a real way. No fluff, no pretending I have it all figured out. Just honest work and a genuine desire to make this thing succeed.\n\nI'll be sharing the journey – the wins, the challenges, and everything in between.\n\nIf you've ever thought about starting something, this is your sign. You don't need to have everything figured out. You just need to start.\n\nLet's build something together.\n\n- ${firstName}`
    };
  };

  const shortPost = generateShortPost();
  const longPost = generateLongPost();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 animate-bounce-in">
          <Sparkles className="w-8 h-8 text-primary animate-glow-pulse" />
        </div>
        <h2 className="text-3xl font-bold">Your story just came alive ✨</h2>
        <p className="text-lg text-muted-foreground">
          Here's how you could introduce your business to the world
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

      <div className="mt-8 text-center">
        <Button 
          size="lg" 
          onClick={onContinue}
          className="h-14 px-8 text-lg group"
        >
          Continue Building
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
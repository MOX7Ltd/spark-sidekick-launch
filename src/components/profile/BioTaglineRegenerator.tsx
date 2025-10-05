import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ThumbsUp, ThumbsDown, RefreshCw, Loader2 } from 'lucide-react';
import { generateBusinessIdentity } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { BusinessIdentity } from '@/lib/db/identity';

interface BioTaglineRegeneratorProps {
  type: 'bio' | 'tagline';
  identity: BusinessIdentity;
  onAccept: (value: string) => void;
}

export const BioTaglineRegenerator = ({
  type,
  identity,
  onAccept
}: BioTaglineRegeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedValue, setGeneratedValue] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setFeedback(null);
    try {
      const result = await generateBusinessIdentity({
        idea: identity.idea || '',
        aboutYou: {
          firstName: '',
          lastName: '',
          expertise: identity.experience || '',
          motivation: identity.bio || '',
          includeFirstName: false,
          includeLastName: false
        },
        vibes: [],
        audiences: identity.audience ? [identity.audience] : []
      });

      const value = type === 'bio' ? result.bio : result.tagline;
      setGeneratedValue(value);
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      toast({
        title: "Generation failed",
        description: `Could not generate ${type}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedValue) {
      onAccept(generatedValue);
      setGeneratedValue(null);
      setFeedback(null);
      toast({
        title: `${type === 'bio' ? 'Bio' : 'Tagline'} updated`,
        description: "Your changes have been saved.",
      });
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Regenerate {type === 'bio' ? 'Bio' : 'Tagline'}
          </>
        )}
      </Button>

      {generatedValue && (
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-sm leading-relaxed">
                {generatedValue}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedback('up')}
                  className={`gap-1.5 ${feedback === 'up' ? 'bg-green-500/10 text-green-600' : ''}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Like
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedback('down')}
                  className={`gap-1.5 ${feedback === 'down' ? 'bg-red-500/10 text-red-600' : ''}`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Dislike
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAccept}
                  className="ml-auto"
                >
                  Use This
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

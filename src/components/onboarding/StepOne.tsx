import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ThumbsUp, ThumbsDown, RefreshCw, CheckCircle, Lightbulb, Mic, Zap, Check } from 'lucide-react';
import { generateProductIdeas, type ProductIdea } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

interface StepOneProps {
  onNext: (idea: string, products: ProductIdea[]) => void;
  initialValue?: string;
}

export const StepOne = ({ onNext, initialValue = '' }: StepOneProps) => {
  const [idea, setIdea] = useState(initialValue);
  const [products, setProducts] = useState<ProductIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [ideaSource, setIdeaSource] = useState<'typed' | 'chip'>('typed');
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [fadingOutId, setFadingOutId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showSparkAnimation, setShowSparkAnimation] = useState(false);
  const { toast } = useToast();

  const motivationalMessages = [
    "Nice work 🚀 — your idea is starting to look real.",
    "This is how people could actually buy into your idea 👏",
    "Your idea has serious potential 💡",
    "You're building something special ✨",
    "Nice work — you've just taken your first step toward making this real! 🔥"
  ];

  useEffect(() => {
    if (hasGenerated && products.length > 0) {
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationalMessage(randomMessage);
    }
  }, [hasGenerated, products.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length >= 12 && products.length > 0) {
      onNext(idea.trim(), products);
    }
  };

  const isValid = idea.trim().length >= 12;
  
  const allInspirationIdeas = [
    "Online coaching program for youth soccer players",
    "Digital course on budgeting and saving for first-home buyers",
    "Subscription-based resume & cover letter templates for job seekers",
    "E-book: \"30-Minute Healthy Meals for Busy Parents\"",
    "Paid newsletter: AI tools & trends explained simply",
    "Membership community for first-time founders",
    "Virtual workshop series on how to land freelance design clients",
    "Stock photo & graphic bundle for small business social media posts",
    "AI-generated prompt pack for Instagram growth hacks",
    "Exclusive video library teaching beginner guitar players step by step"
  ];

  // Randomly select 6 ideas on component mount
  const [inspirationChips] = useState(() => {
    const shuffled = [...allInspirationIdeas].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  });

  const handleChipClick = (chip: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepOne',
      payload: { action: 'select_inspiration_chip', chip }
    });
    
    setIdea(chip);
    setIdeaSource('chip');
    setHasGenerated(false);
    setProducts([]);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Please use Chrome or Edge for voice input.",
        variant: "destructive"
      });
      return;
    }

    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepOne',
      payload: { action: 'start_voice_input' }
    });

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Couldn't hear you",
        description: "Try again or type your idea instead.",
        variant: "destructive"
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIdea(transcript);
      setIdeaSource('typed');
    };

    recognition.start();
  };

  const handleGenerateProducts = async () => {
    if (idea.trim().length < 12) return;
    
    setShowSparkAnimation(true);
    setIsGenerating(true);
    setHasGenerated(true);
    
    try {
      const productIdeas = await generateProductIdeas({
        idea_text: idea.trim(),
        idea_source: ideaSource,
        max_ideas: 4
      });
      
      setProducts(productIdeas);
    } catch (error) {
      console.error('Failed to generate product ideas:', error);
      toast({
        title: "Couldn't generate right now",
        description: "Try again, or tweak your idea.",
        variant: "destructive"
      });
      setHasGenerated(false);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setShowSparkAnimation(false), 1000);
    }
  };

  const handleRefreshProduct = async (productId: string) => {
    setRegeneratingIds(prev => new Set(prev).add(productId));
    
    try {
      const excludeIds = products.map(p => p.id);
      const newProducts = await generateProductIdeas({
        idea_text: idea.trim(),
        idea_source: ideaSource,
        max_ideas: 1,
        exclude_ids: excludeIds
      });
      
      if (newProducts.length > 0) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? newProducts[0] : p
        ));
      }
    } catch (error) {
      console.error('Failed to refresh product:', error);
      toast({
        title: "Couldn't refresh",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleThumbsDown = async (productId: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepOne',
      payload: { action: 'thumbs_down', productId }
    });
    
    setFadingOutId(productId);
    setTimeout(async () => {
      await handleRefreshProduct(productId);
      setFadingOutId(null);
    }, 300);
  };

  const handleThumbsUp = (productId: string) => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepOne',
      payload: { action: 'thumbs_up', productId }
    });
    
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Input Card */}
        <Card className="border-2 border-primary/20 animate-fade-in-up max-w-full">
          <CardContent className="p-4 sm:p-6 space-y-4 max-w-full">
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-bold">What do you want to make money from?</h2>
              </div>
              <p className="text-base text-muted-foreground">
                Describe your offer in plain words. Our A.I. will turn it into sellable products for you.
              </p>
            </div>

            <div className="relative">
              <Textarea
                id="idea"
                placeholder="e.g., premium meal-planning membership for busy parents"
                value={idea}
                onChange={(e) => {
                  setIdea(e.target.value);
                  setIdeaSource('typed');
                }}
                className="min-h-[120px] text-base resize-none pr-12"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={startVoiceInput}
                disabled={isListening}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
              </Button>
            </div>

            {idea.length >= 12 && !hasGenerated && (
              <div className="flex items-center gap-2 text-primary animate-bounce-in">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium break-words">What a great idea! Ready to see some product ideas that you could sell... 🚀</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspiration Chips - Auto-hide when user starts typing */}
        {!hasGenerated && idea.length === 0 && (
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-sm font-medium text-muted-foreground text-center">
              Need inspiration? Tap an idea:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {inspirationChips.map((chip, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-4 py-2 text-xs bg-muted/50 hover:bg-primary/10 hover:border-primary/30 rounded-full transition-all border border-border"
                >
                  💡 {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate Product Ideas Button */}
        {!hasGenerated && isValid && (
          <Card className="border-2 border-dashed border-primary/30 animate-fade-in-up max-w-full" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-4 sm:p-6 text-center space-y-4 max-w-full">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-2">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">
                Let's see what this could become 💡
              </p>
              <p className="text-sm text-muted-foreground">
                Tap 👍 to save ideas you like, 👎 to replace, or 🔄 to refresh for new variations
              </p>
              <Button
                type="button"
                onClick={handleGenerateProducts}
                disabled={isGenerating}
                size="lg"
                variant="hero"
                className="w-full min-h-[3.5rem] h-auto text-base font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Zap className="w-5 h-5 mr-2 animate-pulse shrink-0" />
                    <span className="flex items-center gap-1 text-center">
                      Turning your idea into reality
                      <span className="flex gap-0.5">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 shrink-0" />
                    <span className="text-center">✨ Generate product ideas you could sell</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Spark Animation Overlay */}
        {showSparkAnimation && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="relative">
              <Lightbulb className="w-24 h-24 text-primary animate-lightbulb-power" />
              <Sparkles className="w-12 h-12 text-accent absolute top-0 right-0 animate-pulse" />
            </div>
          </div>
        )}

        {/* Product Ideas Display */}
        {hasGenerated && (
          <div className="space-y-4 animate-fade-in">
            {/* Motivational Message */}
            {motivationalMessage && products.length > 0 && (
              <Card className="bg-primary/5 border-2 border-primary/20 animate-bounce-in max-w-full">
                <CardContent className="p-3 sm:p-4 max-w-full">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse shrink-0" />
                      <p className="font-semibold text-sm sm:text-base break-words">{motivationalMessage}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 bg-background shrink-0 self-start sm:self-auto">
                      <CheckCircle className="w-3 h-3 text-primary" />
                      <span className="whitespace-nowrap">Step 1 done ✨</span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm sm:text-base font-bold break-words">
                Here's how your idea could start making money 💡
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateProducts}
                disabled={isGenerating}
                className="self-start sm:self-auto whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                Refresh all
              </Button>
            </div>
            
            <div className="space-y-3">
              {isGenerating && products.length === 0 ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, idx) => (
                  <Card key={idx} className="border-primary/20 max-w-full">
                    <CardContent className="p-3 sm:p-4 space-y-3 max-w-full">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-12 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                products.map((product, idx) => (
                  <Card 
                    key={product.id} 
                    className={`border-2 transition-all duration-300 hover:shadow-lg max-w-full ${
                      likedProducts.has(product.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-primary/20 hover:border-primary/40'
                    } ${fadingOutId === product.id ? 'animate-fade-out' : 'animate-fade-in-up'}`}
                    style={{ 
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    <CardContent className="p-3 sm:p-4 max-w-full">
                      {regeneratingIds.has(product.id) ? (
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <h4 className="font-semibold text-sm sm:text-base mb-1 break-words">{product.title}</h4>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">{product.format}</Badge>
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed break-words">
                              {product.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleThumbsUp(product.id)}
                              className={`flex-1 hover:scale-105 transition-all min-h-[2.25rem] h-auto py-2 ${
                                likedProducts.has(product.id) 
                                  ? 'bg-primary/10 text-primary' 
                                  : 'hover:bg-primary/10'
                              }`}
                            >
                              {likedProducts.has(product.id) ? (
                                <>
                                  <Check className="w-4 h-4 mr-1 shrink-0" />
                                  <span className="text-center">Selected</span>
                                </>
                              ) : (
                                <>
                                  <ThumbsUp className="w-4 h-4 mr-1 shrink-0" />
                                  <span className="text-center">Looks good</span>
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleThumbsDown(product.id)}
                              className="hover:bg-destructive/10 hover:scale-110 transition-all whitespace-nowrap"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefreshProduct(product.id)}
                              className="hover:bg-accent/10 hover:scale-110 transition-all whitespace-nowrap"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Refine these anytime after signup. Your starter pack turns them into real products.
            </p>
          </div>
        )}

        {/* Next step section - Shows after products are generated */}
        {hasGenerated && products.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20 animate-fade-in-up max-w-full">
            <CardContent className="p-4 sm:p-6 text-center space-y-3 max-w-full">
              <p className="text-center font-medium break-words">
                Your idea is taking shape! ✨
              </p>
              <Button 
                type="submit" 
                size="lg"
                variant="hero"
                className="w-full h-14 text-base font-semibold"
                disabled={!isValid}
              >
                Great — tell us about yourself →
              </Button>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

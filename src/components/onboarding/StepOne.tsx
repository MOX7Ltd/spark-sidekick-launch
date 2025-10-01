import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ThumbsUp, ThumbsDown, RefreshCw, CheckCircle, Lightbulb } from 'lucide-react';
import { generateProductIdeas, type ProductIdea } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StepOneProps {
  onNext: (idea: string) => void;
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
  const [showConfetti, setShowConfetti] = useState<string | null>(null);
  const [fadingOutId, setFadingOutId] = useState<string | null>(null);
  const { toast } = useToast();

  const motivationalMessages = [
    "Nice! You're onto something big 🚀",
    "Your idea has serious potential 👏",
    "Let's make this real 🔥",
    "This could be amazing ✨",
    "You're building something special 💪",
    "Great thinking! Let's go 🎯"
  ];

  useEffect(() => {
    if (hasGenerated && products.length > 0) {
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationalMessage(randomMessage);
    }
  }, [hasGenerated, products.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length >= 12) {
      onNext(idea.trim());
    }
  };

  const isValid = idea.trim().length >= 12;
  
  const inspirationChips = [
    "Local running club with paid weekly sessions",
    "Meal-prep plans for gym beginners",
    "Notion templates for freelancers",
    "Photography mini-sessions (weekends)",
    "Kids' homework + study skills workshop",
    "Digital crochet patterns shop",
  ];

  const handleChipClick = (chip: string) => {
    setIdea(chip);
    setIdeaSource('chip');
    setHasGenerated(false);
    setProducts([]);
  };

  const handleGenerateProducts = async () => {
    if (idea.trim().length < 12) return;
    
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
    setFadingOutId(productId);
    setTimeout(async () => {
      await handleRefreshProduct(productId);
      setFadingOutId(null);
    }, 300);
  };

  const handleThumbsUp = (productId: string, event: React.MouseEvent) => {
    console.log('Product liked:', productId);
    
    // Create confetti particles
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const colors = ['hsl(185, 85%, 45%)', 'hsl(35, 95%, 55%)', 'hsl(185, 70%, 65%)', 'hsl(35, 85%, 75%)'];
    
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
      particle.style.setProperty('--y', `${-Math.random() * 150 - 50}px`);
      particle.style.animationDelay = `${Math.random() * 0.1}s`;
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 1000);
    }
    
    setShowConfetti(productId);
    setTimeout(() => setShowConfetti(null), 800);
    
    toast({
      title: "Great choice!",
      description: "We'll refine these after you sign up.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Sparkles className="w-7 h-7 text-accent animate-pulse" />
          <h2 className="text-3xl font-bold">Your Idea</h2>
        </div>
        <p className="text-lg font-semibold text-foreground mb-1">
          What do you want to make money from?
        </p>
        <p className="text-sm text-muted-foreground">
          Describe your offer in plain words. Our A.I. will turn the idea into sellable products for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <Textarea
            id="idea"
            placeholder="e.g., premium meal-planning membership for busy parents"
            value={idea}
            onChange={(e) => {
              setIdea(e.target.value);
              setIdeaSource('typed');
            }}
            className="min-h-[100px] text-base p-4 border-2 focus:border-primary transition-all resize-none"
            autoFocus
          />
        </div>

        {/* Inspiration Chips */}
        {!hasGenerated && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Need inspiration? Tap an idea:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inspirationChips.map((chip, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-lg transition-all border hover:border-primary/30"
                >
                  💡 {chip}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              These are just starter ideas — your starter pack will turn them into real products you can sell.
            </p>
          </div>
        )}

        {/* Generate Product Ideas Button */}
        {!hasGenerated && (
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="p-6 text-center space-y-4">
              <p className="font-medium text-foreground">
                Do you want to see what your products might look like?
              </p>
              <p className="text-sm text-muted-foreground">
                Use 👍 to mark ideas you like, 👎 to generate a replacement, or the refresh icon to try a different variation.
              </p>
                <Button
                type="button"
                onClick={handleGenerateProducts}
                disabled={!isValid || isGenerating}
                size="lg"
                className="w-full sm:w-auto relative"
              >
                {isGenerating ? (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2 animate-pulse" />
                    <span className="flex items-center gap-1">
                      Generating
                      <span className="flex gap-0.5">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate product ideas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Product Ideas Display */}
        {hasGenerated && (
          <div className="space-y-4 animate-fade-in">
            {/* Motivational Message & Progress Badge */}
            {motivationalMessage && products.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg animate-bounce-in">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary animate-lightbulb-power" />
                  <p className="font-semibold text-foreground">{motivationalMessage}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 bg-background animate-glow-pulse">
                  <CheckCircle className="w-3 h-3 text-primary" />
                  Idea Locked In
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Here's how your idea could become products that make you money 💡
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateProducts}
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate all
              </Button>
            </div>
            
            <div className="grid gap-3">
              {isGenerating && products.length === 0 ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, idx) => (
                  <Card key={idx} className="border-primary/20">
                    <CardContent className="p-4 space-y-3">
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
                    className={`border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden ${
                      fadingOutId === product.id ? 'animate-fade-out' : 'animate-fade-in-up'
                    } ${showConfetti === product.id ? 'animate-glow-pulse' : ''}`}
                    style={{ 
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    <CardContent className="p-4 relative">
                      {regeneratingIds.has(product.id) ? (
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">{product.title}</h4>
                              <Badge variant="outline" className="mt-1 text-xs">{product.format}</Badge>
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                {product.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleThumbsUp(product.id, e)}
                              className="flex-1 hover:bg-primary/10 hover:scale-105 transition-all duration-200 active:scale-95"
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Looks good
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleThumbsDown(product.id)}
                              className="hover:bg-destructive/10 hover:scale-110 transition-all duration-200 active:scale-95"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRefreshProduct(product.id)}
                              className="hover:bg-accent/10 hover:scale-110 transition-all duration-200 active:scale-95"
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

            <p className="text-xs text-muted-foreground text-center">
              Refine these anytime after signup. Your starter pack turns them into real products.
            </p>
          </div>
        )}

        {hasGenerated && (
          <div className="pt-2">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 text-base font-semibold"
              disabled={!isValid}
            >
              Next step - tell us a bit about yourself
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
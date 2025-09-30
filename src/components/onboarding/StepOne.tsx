import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Package, DollarSign } from 'lucide-react';

interface StepOneProps {
  onNext: (idea: string) => void;
  initialValue?: string;
}

export const StepOne = ({ onNext, initialValue = '' }: StepOneProps) => {
  const [idea, setIdea] = useState(initialValue);
  const [showPreview, setShowPreview] = useState(false);
  const [products, setProducts] = useState<Array<{title: string; type: string; price: string; description: string}>>([]);
  const [taglines, setTaglines] = useState<string[]>([]);

  useEffect(() => {
    if (idea.trim().length >= 10) {
      setShowPreview(true);
      generateMockups();
    } else {
      setShowPreview(false);
    }
  }, [idea]);

  const generateMockups = () => {
    const ideaLower = idea.toLowerCase();
    
    if (ideaLower.includes('fitness') || ideaLower.includes('health') || ideaLower.includes('workout')) {
      setProducts([
        { 
          title: "7-Day Fitness Blueprint", 
          type: "Digital Guide", 
          price: "$29",
          description: "Step-by-step workout plans and habit-building strategies that help you build consistency and see real results in your first week."
        },
        { 
          title: "Nutrition Tracker Template", 
          type: "Template Pack", 
          price: "$19",
          description: "Easy-to-use meal planning tools that take the guesswork out of healthy eating so you can fuel your body right."
        },
      ]);
      setTaglines([
        "Your journey to better health starts here",
        "Transform your fitness, one day at a time",
        "Making healthy habits stick"
      ]);
    } else if (ideaLower.includes('parent') || ideaLower.includes('family') || ideaLower.includes('kid')) {
      setProducts([
        { 
          title: "Parent Survival Guide", 
          type: "Digital Guide", 
          price: "$27",
          description: "Practical strategies for managing the chaos of family life, from bedtime battles to sibling rivalry, with confidence and calm."
        },
        { 
          title: "Family Activity Planner", 
          type: "Template Pack", 
          price: "$15",
          description: "Ready-to-go activity ideas and schedule templates that help you create quality time without the planning stress."
        },
      ]);
      setTaglines([
        "Making family life easier, one tip at a time",
        "Parenting support when you need it most",
        "Because raising kids takes a village"
      ]);
    } else if (ideaLower.includes('business') || ideaLower.includes('entrepreneur') || ideaLower.includes('startup')) {
      setProducts([
        { 
          title: "Business Launch Checklist", 
          type: "Digital Guide", 
          price: "$39",
          description: "Step-by-step tasks that take the guesswork out of launching, so you can go from idea to live business with confidence."
        },
        { 
          title: "Financial Planning Templates", 
          type: "Template Pack", 
          price: "$29",
          description: "Easy-to-use spreadsheets that help you track costs, plan income, and stay on top of your business finances from day one."
        },
      ]);
      setTaglines([
        "Turn your side hustle into real income",
        "Building businesses that actually work",
        "Your roadmap to entrepreneurial success"
      ]);
    } else {
      setProducts([
        { 
          title: "Complete Starter Guide", 
          type: "Digital Guide", 
          price: "$37",
          description: "Everything you need to get started quickly and confidently, with clear steps that eliminate confusion and accelerate your progress."
        },
        { 
          title: "Quick Reference Checklist", 
          type: "Template Pack", 
          price: "$19",
          description: "Essential tasks and resources organized in one place, so you never miss a critical step on your journey."
        },
      ]);
      setTaglines([
        "Making it simple to get started",
        "Your success starts here",
        "Expert guidance made accessible"
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length >= 10) {
      onNext(idea.trim());
    }
  };

  const isValid = idea.trim().length >= 10;
  
  const exampleIdeas = [
    "staying organized while juggling work and family",
    "building confidence through fitness and nutrition",
    "creating their own microbusiness with easy setup",
  ];

  const handleExampleClick = (example: string) => {
    setIdea(example);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Sparkles className="w-7 h-7 text-accent animate-pulse" />
          <h2 className="text-3xl font-bold">Your Idea</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          I want to help people with...
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <Textarea
            id="idea"
            placeholder="e.g., staying organized while juggling work and family"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="min-h-[100px] text-base p-4 border-2 focus:border-primary transition-all resize-none"
            autoFocus
          />
          
          {showPreview && (
            <div className="text-sm text-primary font-medium animate-fade-in flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Nice choice! Watch it come alive →
            </div>
          )}
        </div>

        {/* Product Mockups Preview */}
        {showPreview && products.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Product mockups (preview)</span>
            </div>
            
            <div className="grid gap-3">
              {products.map((product, idx) => (
                <Card key={idx} className="border-primary/20 hover:border-primary/40 transition-all hover:scale-[1.01]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{product.title}</h4>
                        <Badge variant="outline" className="mt-1 text-xs">{product.type}</Badge>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>
                      </div>
                      <div className="text-lg font-bold text-accent flex items-center gap-1 whitespace-nowrap">
                        <DollarSign className="h-4 w-4" />
                        {product.price.replace('$', '')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tagline suggestions */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-muted-foreground">Draft taglines</div>
              <div className="flex flex-wrap gap-2">
                {taglines.map((tagline, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs py-1 px-3">
                    {tagline}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Example Ideas */}
        {!showPreview && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Need inspiration? Try one of these:
            </Label>
            <div className="grid gap-2">
              {exampleIdeas.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-lg transition-all border hover:border-primary/30"
                >
                  💡 {example}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-12 text-base font-semibold"
            disabled={!isValid}
          >
            {showPreview ? '🔥 Next → Watch it come alive' : 'Next step'}
          </Button>
          
          {!isValid && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              Tell us a bit more about your idea to continue
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
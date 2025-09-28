import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Target, TrendingUp, Heart, DollarSign } from 'lucide-react';

interface IdeaPreviewProps {
  idea: string;
}

interface BusinessPreview {
  names: { name: string; type: string }[];
  positioning: string;
  products: { title: string; type: string; price: string }[];
  samplePost: {
    hook: string;
    caption: string;
    hashtags: string[];
  };
  colors: { primary: string; accent: string; secondary: string };
}

export const IdeaPreview = ({ idea }: IdeaPreviewProps) => {
  const [preview, setPreview] = useState<BusinessPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock preview generation - in real app this would call an API
  const generatePreview = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockPreview: BusinessPreview = {
      names: [
        { name: "Productivity Mastery Hub", type: "Professional" },
        { name: "Focus Flow Academy", type: "Creative" },
        { name: "Alex Chen Coaching", type: "Personal Brand" }
      ],
      positioning: "I help busy professionals transform chaos into clarity with simple, ADHD-friendly productivity systems that actually work.",
      products: [
        { title: "The 5-Minute Focus Guide", type: "Digital Guide", price: "$29" },
        { title: "ADHD-Friendly Task Templates", type: "Checklist Pack", price: "$19" },
        { title: "1:1 Productivity Audit", type: "Service", price: "$149" }
      ],
      samplePost: {
        hook: "Stop trying to fix your ADHD brain with neurotypical productivity hacks 🧠",
        caption: "Here's the truth: Traditional to-do lists don't work for us. Our brains need visual cues, dopamine hits, and systems that work WITH our natural patterns, not against them.\n\nTry this instead:\n✅ Use color-coded priority levels\n✅ Set 15-minute focus blocks\n✅ Celebrate micro-wins immediately\n\nWhat's one productivity hack that actually works for your brain? 👇",
        hashtags: ["#ADHDProductivity", "#NeurodivergentLife", "#ProductivityHacks", "#ADHDSupport", "#FocusTips"]
      },
      colors: {
        primary: "#2DD4BF",
        accent: "#F59E0B", 
        secondary: "#1E40AF"
      }
    };
    
    setPreview(mockPreview);
    setIsLoading(false);
  };

  const resetPreview = () => {
    setPreview(null);
  };

  if (!preview && !isLoading) {
    return (
      <div className="text-center">
        <Button 
          variant="hero" 
          size="xl" 
          onClick={generatePreview}
          className="animate-in"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Your Business Preview
        </Button>
        <p className="text-muted-foreground mt-3 text-sm">
          Get instant name ideas, product suggestions, and sample content
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center space-y-6 animate-in">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Crafting your business preview...</span>
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-primary rounded-full animate-pulse w-3/4"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyzing your idea • Generating names • Creating content samples
          </p>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Here's your business preview! 🎉</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Based on your idea, we've created a complete business foundation. 
          Click "Make this real" to unlock your storefront and launch campaigns.
        </p>
      </div>

      <div className="grid gap-6 md:gap-8">
        {/* Business Names */}
        <Card className="hex-pattern">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <span>Business Name Options</span>
            </CardTitle>
            <CardDescription>Choose the style that fits your personality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {preview.names.map((name, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-smooth">
                  <div className="font-semibold text-foreground">{name.name}</div>
                  <Badge variant="secondary" className="mt-2">{name.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Positioning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Your Positioning Statement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gradient-subtle rounded-lg">
              <p className="text-lg leading-relaxed italic">"{preview.positioning}"</p>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-brand-orange" />
              <span>Starter Product Ideas</span>
            </CardTitle>
            <CardDescription>Ready-to-sell products based on your expertise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {preview.products.map((product, idx) => (
                <div key={idx} className="p-4 rounded-lg border hover:border-primary/50 transition-smooth">
                  <h4 className="font-semibold text-foreground">{product.title}</h4>
                  <Badge variant="outline" className="mt-2 mb-3">{product.type}</Badge>
                  <div className="font-bold text-brand-orange text-lg">{product.price}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sample Post */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-brand-teal" />
              <span>Sample Social Media Post</span>
            </CardTitle>
            <CardDescription>Ready-to-share content that converts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 p-4 bg-gradient-subtle rounded-lg">
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Hook</h4>
                <p className="font-bold text-lg">{preview.samplePost.hook}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Caption</h4>
                <p className="leading-relaxed whitespace-pre-line">{preview.samplePost.caption}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {preview.samplePost.hashtags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-primary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <div className="space-y-3">
          <Button variant="starter" size="xl" className="w-full max-w-sm">
            <Heart className="mr-2 h-5 w-5" />
            Make this real for $10
          </Button>
          <p className="text-sm text-muted-foreground">
            Unlock your storefront + 3 launch campaigns + business tools
          </p>
        </div>
        
        <Button variant="ghost" onClick={resetPreview} size="sm">
          Try a different idea
        </Button>
      </div>
    </div>
  );
};
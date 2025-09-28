import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, DollarSign, TrendingUp, Lock } from 'lucide-react';

interface LivePreviewProps {
  idea: string;
  audience?: string;
  namingPreference?: string;
  isBlurred?: boolean;
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
}

export const LivePreview = ({ idea, audience, namingPreference, isBlurred = false }: LivePreviewProps) => {
  // Generate preview based on inputs
  const generatePreview = (): BusinessPreview => {
    const baseNames = [
      "Productivity Mastery Hub",
      "Focus Flow Academy", 
      "The Clarity Collective"
    ];
    
    const personalNames = [
      "Sarah Chen Coaching",
      "Alex Thompson's Guide", 
      "Jamie Rivera Consulting"
    ];
    
    return {
      names: namingPreference === 'with_personal_name' 
        ? [
            { name: personalNames[0], type: "Personal Brand" },
            { name: personalNames[1], type: "Professional" },
            { name: baseNames[0], type: "Alternative" }
          ]
        : [
            { name: baseNames[0], type: "Professional" },
            { name: baseNames[1], type: "Creative" },
            { name: personalNames[0], type: "Personal Option" }
          ],
      positioning: audience 
        ? `I help ${audience.replace('_', ' ')} transform chaos into clarity with simple, proven systems that actually work.`
        : "Transform your ideas into actionable results with proven systems.",
      products: [
        { title: "5-Minute Focus Guide", type: "Digital Guide", price: "$29" },
        { title: "Productivity Templates", type: "Checklist Pack", price: "$19" },
        { title: "1:1 Strategy Session", type: "Service", price: "$149" }
      ],
      samplePost: {
        hook: "Stop trying to fix your brain with systems that don't work 🧠",
        caption: `Here's the truth: Generic productivity advice doesn't work for everyone. Your brain is unique, and your systems should be too.\n\nTry this instead:\n✅ Work with your natural rhythms\n✅ Set up visual progress cues\n✅ Celebrate small wins immediately\n\nWhat's one productivity hack that actually works for you? 👇`,
        hashtags: ["#Productivity", "#Focus", "#LifeHacks", "#Mindset", "#Success"]
      }
    };
  };

  const preview = generatePreview();

  return (
    <div className={`space-y-6 ${isBlurred ? 'blur-sm pointer-events-none' : ''} animate-fade-in`}>
      {/* Header with Lock Overlay */}
      <div className="relative">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Your business preview 🎉</h3>
          <p className="text-muted-foreground">Here's what we're building for you...</p>
        </div>
        
        {isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4 border shadow-brand-md">
              <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-center">Almost there!</p>
            </div>
          </div>
        )}
      </div>

      {/* Business Names */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Lightbulb className="h-5 w-5 text-accent" />
            <span>Business Names</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {preview.names.map((name, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-background/50">
                <div className="font-semibold">{name.name}</div>
                <Badge variant="secondary" className="mt-1 text-xs">{name.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Positioning */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            <span>Your Positioning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground italic leading-relaxed">
            "{preview.positioning}"
          </p>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <DollarSign className="h-5 w-5 text-brand-orange" />
            <span>Starter Products</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {preview.products.map((product, idx) => (
              <div key={idx} className="p-3 rounded-lg border">
                <h4 className="font-semibold">{product.title}</h4>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">{product.type}</Badge>
                  <span className="font-bold text-brand-orange">{product.price}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Post */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <TrendingUp className="h-5 w-5 text-brand-teal" />
            <span>Sample Content</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Hook</h5>
            <p className="font-semibold">{preview.samplePost.hook}</p>
          </div>
          
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Caption</h5>
            <p className="text-sm leading-relaxed whitespace-pre-line">{preview.samplePost.caption}</p>
          </div>
          
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Hashtags</h5>
            <div className="flex flex-wrap gap-1">
              {preview.samplePost.hashtags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
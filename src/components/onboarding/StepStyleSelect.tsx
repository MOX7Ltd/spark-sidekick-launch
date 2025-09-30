import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Target, Zap, Lightbulb } from 'lucide-react';

interface StepStyleSelectProps {
  onNext: (style: string) => void;
  onBack: () => void;
  initialValue?: string;
  isLoading?: boolean;
}

const styleCategories = [
  { 
    id: 'professional', 
    label: 'Professional', 
    icon: Target, 
    gradient: 'from-blue-600 to-indigo-600',
    description: 'Trustworthy, established, corporate-friendly',
    examples: 'Think: "Strategic Solutions", "Momentum Consulting"'
  },
  { 
    id: 'playful', 
    label: 'Playful', 
    icon: Sparkles, 
    gradient: 'from-pink-500 to-purple-500',
    description: 'Fun, memorable, approachable',
    examples: 'Think: "Spark Studio", "Happy Trails"'
  },
  { 
    id: 'minimalist', 
    label: 'Minimalist', 
    icon: Lightbulb, 
    gradient: 'from-gray-700 to-gray-900',
    description: 'Clean, modern, simple',
    examples: 'Think: "Base", "Core Collective"'
  },
  { 
    id: 'visionary', 
    label: 'Visionary', 
    icon: Zap, 
    gradient: 'from-amber-500 to-orange-600',
    description: 'Bold, forward-thinking, disruptive',
    examples: 'Think: "Nexus Labs", "Frontier Group"'
  },
];

export const StepStyleSelect = ({ onNext, onBack, initialValue, isLoading }: StepStyleSelectProps) => {
  const [selectedStyle, setSelectedStyle] = useState(initialValue || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStyle) {
      onNext(selectedStyle);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Sparkles className="w-7 h-7 text-primary" />
          <h2 className="text-3xl font-bold">Choose Your Business Style</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          This will help us generate names that match your vision
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {styleCategories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedStyle === category.id;
            
            return (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:scale-[1.02] ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedStyle(category.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">{category.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      {category.examples}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedStyle && (
          <p className="text-sm text-primary font-medium text-center animate-fade-in">
            🔥 Great choice! This style will guide your business identity
          </p>
        )}

        <div className="flex gap-4 pt-2">
          <Button 
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1 h-12 text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button 
            type="submit"
            size="lg"
            disabled={!selectedStyle || isLoading}
            className="flex-1 h-12 text-base"
          >
            {isLoading ? 'Generating...' : 'Generate Business Names →'}
          </Button>
        </div>
      </form>
    </div>
  );
};
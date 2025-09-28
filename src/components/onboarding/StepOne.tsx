import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, ArrowRight } from 'lucide-react';

interface StepOneProps {
  onNext: (idea: string) => void;
  initialValue?: string;
}

export const StepOne = ({ onNext, initialValue = '' }: StepOneProps) => {
  const [idea, setIdea] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length >= 10) {
      onNext(idea.trim());
    }
  };

  const isValid = idea.trim().length >= 10;
  
  const exampleIdeas = [
    "Help busy parents with quick, healthy meal planning",
    "Teach productivity systems for creative professionals", 
    "Guide small business owners through social media marketing",
    "Create meditation courses for anxious professionals"
  ];

  const handleExampleClick = (example: string) => {
    setIdea(example);
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center animate-bounce-in">
          <Lightbulb className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          What's your idea? ✨
        </h2>
        <p className="text-lg text-muted-foreground">
          Tell us what you want to help people with. We'll handle the hard part.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="idea" className="text-lg font-semibold">
            I want to help people with...
          </Label>
          <Textarea
            id="idea"
            placeholder="Type your idea here... (be as specific as you can!)"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="min-h-[120px] text-lg p-4 border-2 focus:border-primary transition-smooth resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {idea.length < 10 ? `Need ${10 - idea.length} more characters` : "Perfect! 🎉"}
            </span>
            <span className={`font-medium ${isValid ? 'text-primary' : 'text-muted-foreground'}`}>
              {idea.length}/500
            </span>
          </div>
        </div>

        {/* Example Ideas */}
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
                className="p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-lg transition-smooth border hover:border-primary/30"
              >
                💡 {example}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 text-lg font-semibold"
            disabled={!isValid}
            variant="hero"
          >
            Next step
            <ArrowRight className="ml-2 w-5 h-5" />
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
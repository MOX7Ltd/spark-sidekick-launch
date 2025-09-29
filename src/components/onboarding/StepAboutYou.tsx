import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { User, Sparkles } from 'lucide-react';

interface StepAboutYouProps {
  onNext: (data: { firstName: string; expertise: string; style: string }) => void;
  onBack: () => void;
  initialValue?: { firstName?: string; expertise?: string; style?: string };
  isLoading?: boolean;
}

export const StepAboutYou = ({ onNext, onBack, initialValue, isLoading }: StepAboutYouProps) => {
  const [firstName, setFirstName] = useState(initialValue?.firstName || '');
  const [expertise, setExpertise] = useState(initialValue?.expertise || '');
  const [style, setStyle] = useState(initialValue?.style || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ firstName, expertise, style });
  };

  const isValid = expertise.length >= 5 && style;

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-accent rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3">About You</h2>
        <p className="text-muted-foreground text-lg">
          Let's personalize your business identity and make it authentically yours.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name (Optional)</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Sarah"
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground">
              We'll use this to personalize your bio and social posts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">Your Background/Expertise</Label>
            <Textarea
              id="expertise"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="e.g. I've been meal planning for busy families for 5 years..."
              className="text-lg resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                This helps us create your personalized bio and positioning
              </p>
              <span className={`text-sm ${expertise.length >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
                {expertise.length}/5+ characters
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Preferred Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Choose your communication style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">
                  <div className="flex items-center space-x-2">
                    <span>💼</span>
                    <div>
                      <div className="font-medium">Professional</div>
                      <div className="text-sm text-muted-foreground">Clear, authoritative, expert-focused</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="friendly">
                  <div className="flex items-center space-x-2">
                    <span>🤗</span>
                    <div>
                      <div className="font-medium">Friendly</div>
                      <div className="text-sm text-muted-foreground">Warm, approachable, conversational</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="playful">
                  <div className="flex items-center space-x-2">
                    <span>✨</span>
                    <div>
                      <div className="font-medium">Playful</div>
                      <div className="text-sm text-muted-foreground">Fun, creative, energetic</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isValid && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
              <div className="flex items-center space-x-2 text-primary">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Perfect! This will make your bio shine ✨</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
            >
              ← Back
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Generating...' : 'Next Step →'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
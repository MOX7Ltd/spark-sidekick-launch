import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Brain, Users, Briefcase, MessageSquare } from 'lucide-react';

interface IdeaInputProps {
  onSubmit: (data: IdeaFormData) => void;
}

export interface IdeaFormData {
  idea: string;
  experience?: string;
  audience?: string;
  niche?: string;
}

export const IdeaInput = ({ onSubmit }: IdeaInputProps) => {
  const [formData, setFormData] = useState<IdeaFormData>({
    idea: '',
    experience: '',
    audience: '',
    niche: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.idea.trim()) {
      onSubmit(formData);
    }
  };

  const isValid = formData.idea.trim().length > 10;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-4">
        <CardTitle className="text-2xl md:text-3xl font-bold">
          What's your business idea? 🚀
        </CardTitle>
        <CardDescription className="text-lg">
          Tell us about your expertise, passion, or side-hustle idea. 
          We'll create a complete business preview in seconds.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Idea Input */}
          <div className="space-y-3">
            <Label htmlFor="idea" className="flex items-center space-x-2 text-base font-semibold">
              <Brain className="h-4 w-4 text-primary" />
              <span>Your Business Idea *</span>
            </Label>
            <Textarea
              id="idea"
              placeholder="I want to help busy parents with meal planning... or I'm a yoga instructor looking to create online classes... or I know a lot about home organization..."
              value={formData.idea}
              onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
              className="min-h-[120px] text-base"
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              The more specific you are, the better we can help! (Minimum 10 characters)
            </p>
          </div>

          {/* Optional Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="experience" className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-brand-teal" />
                <span>Your Experience (Optional)</span>
              </Label>
              <Input
                id="experience"
                placeholder="5 years in marketing, certified trainer, etc."
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="audience" className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-brand-orange" />
                <span>Target Audience (Optional)</span>
              </Label>
              <Input
                id="audience"
                placeholder="Working moms, small business owners, etc."
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="niche" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-brand-navy" />
              <span>Keywords/Niche (Optional)</span>
            </Label>
            <Input
              id="niche"
              placeholder="productivity, wellness, finance, creativity..."
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
            />
          </div>

          <Button 
            type="submit" 
            variant="hero" 
            size="lg" 
            className="w-full"
            disabled={!isValid}
          >
            Get My Business Preview
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
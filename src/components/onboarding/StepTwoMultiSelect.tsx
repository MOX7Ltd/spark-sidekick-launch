import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Baby, GraduationCap, Briefcase, Palette, MapPin, Globe, Heart, Target } from 'lucide-react';

interface StepTwoMultiSelectProps {
  onNext: (audiences: string[]) => void;
  onBack: () => void;
  initialValue?: string;
  isLoading?: boolean;
}

const audienceOptions = [
  { id: 'parents', label: 'Parents & Families', icon: Baby, color: 'from-pink-500 to-rose-500', description: 'Busy parents juggling it all' },
  { id: 'learners', label: 'Learners & Students', icon: GraduationCap, color: 'from-blue-500 to-cyan-500', description: 'People eager to grow' },
  { id: 'entrepreneurs', label: 'Entrepreneurs & Side-Hustlers', icon: Briefcase, color: 'from-purple-500 to-indigo-500', description: 'Building their dreams' },
  { id: 'professionals', label: 'Working Professionals', icon: Target, color: 'from-green-500 to-emerald-500', description: 'Career-focused achievers' },
  { id: 'creators', label: 'Creators & Influencers', icon: Palette, color: 'from-orange-500 to-amber-500', description: 'Content creators & artists' },
  { id: 'local', label: 'Local Community', icon: MapPin, color: 'from-teal-500 to-cyan-500', description: 'Your neighbors & local area' },
  { id: 'global', label: 'Global Audience', icon: Globe, color: 'from-blue-600 to-indigo-600', description: 'Anyone, anywhere' },
  { id: 'hobbyists', label: 'Hobbyists / Special Interests', icon: Heart, color: 'from-red-500 to-pink-500', description: 'Passionate enthusiasts' },
  { id: 'everyone', label: 'Everyone', icon: Users, color: 'from-gray-600 to-gray-700', description: 'No specific audience' },
];

export const StepTwoMultiSelect = ({ onNext, onBack, initialValue, isLoading = false }: StepTwoMultiSelectProps) => {
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(
    initialValue ? [initialValue] : []
  );

  const toggleAudience = (audienceId: string) => {
    setSelectedAudiences(prev => 
      prev.includes(audienceId)
        ? prev.filter(id => id !== audienceId)
        : [...prev, audienceId]
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (selectedAudiences.length > 0) {
      // Pass the first selected audience for backward compatibility
      onNext(selectedAudiences);
    }
  };

  const isValid = selectedAudiences.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Users className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Target Audience</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Who are you here to help? (Select all that apply)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {audienceOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedAudiences.includes(option.id);
            
            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all hover:scale-[1.02] ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleAudience(option.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${option.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold text-sm leading-tight">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedAudiences.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-sm font-medium text-muted-foreground">Selected audiences:</p>
            <div className="flex flex-wrap gap-2">
              {selectedAudiences.map(id => {
                const option = audienceOptions.find(o => o.id === id);
                return option ? (
                  <Badge key={id} variant="default" className="text-sm py-1 px-3">
                    {option.label}
                  </Badge>
                ) : null;
              })}
            </div>
            <p className="text-sm text-primary font-medium mt-2">
              🔥 Perfect! Your content will speak to them
            </p>
          </div>
        )}

        <div className="flex gap-4">
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
            disabled={!isValid || isLoading}
            className="flex-1 h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Generating your business...' : 'Perfect — now let\'s give your business a name! →'}
          </Button>
        </div>
      </form>
    </div>
  );
};
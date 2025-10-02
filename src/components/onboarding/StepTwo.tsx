import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ArrowRight, ArrowLeft, GraduationCap, Baby, Briefcase, Sparkles } from 'lucide-react';

interface StepTwoProps {
  onNext: (audience: string) => void;
  onBack: () => void;
  initialValue?: string;
  isLoading?: boolean;
}

const audienceOptions = [
  {
    id: 'learners',
    label: 'Learners & Students',
    description: 'People wanting to develop new skills',
    icon: GraduationCap,
    color: 'bg-blue-500'
  },
  {
    id: 'parents',
    label: 'Parents & Families',
    description: 'Busy families juggling life and kids',
    icon: Baby,
    color: 'bg-pink-500'
  },
  {
    id: 'entrepreneurs',
    label: 'Entrepreneurs & Creators',
    description: 'Business owners and side-hustlers',
    icon: Briefcase,
    color: 'bg-purple-500'
  },
  {
    id: 'professionals',
    label: 'Working Professionals',
    description: 'Career-focused individuals',
    icon: Users,
    color: 'bg-green-500'
  },
  {
    id: 'other',
    label: 'Other/Everyone',
    description: 'Broader audience or specific niche',
    icon: Sparkles,
    color: 'bg-orange-500'
  }
];

export const StepTwo = ({ onNext, onBack, initialValue, isLoading = false }: StepTwoProps) => {
  const [selectedAudience, setSelectedAudience] = useState(initialValue || '');

  const handleSubmit = () => {
    if (selectedAudience) {
      onNext(selectedAudience);
    }
  };

  const selectedOption = audienceOptions.find(opt => opt.id === selectedAudience);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-2xl sm:text-3xl font-bold">Who's it for?</h2>
        </div>
        <p className="text-base text-muted-foreground">
          Choose the audience that best fits your idea
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {audienceOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedAudience === option.id;
          
          return (
            <Card 
              key={option.id}
              className={`
                cursor-pointer transition-smooth hover:shadow-brand-md border-2
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-brand-md' 
                  : 'border-border hover:border-primary/30'
                }
              `}
              onClick={() => setSelectedAudience(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    <p className="text-muted-foreground">{option.description}</p>
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-smooth
                    ${isSelected 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground'
                    }
                  `}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full animate-scale-in" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedOption && (
        <div className="text-center mb-6 p-4 bg-primary/5 rounded-lg animate-fade-in">
          <p className="text-primary font-medium">
            Great choice! Your idea + {selectedOption.label.toLowerCase()} = 🎯
          </p>
        </div>
      )}

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-3xl mx-auto space-y-2">
          <Button 
            variant="secondary" 
            size="default"
            onClick={onBack}
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            onClick={handleSubmit}
            disabled={!selectedAudience || isLoading}
            variant="hero"
          >
            {isLoading ? "Processing..." : "Continue →"}
          </Button>
        </div>
      </div>
    </div>
  );
};
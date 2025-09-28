import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Eye, ArrowRight, UserCheck } from 'lucide-react';

interface StepThreeProps {
  onNext: (namingPreference: string) => void;
  onBack: () => void;
  initialValue?: string;
}

const namingOptions = [
  {
    id: 'with_personal_name',
    title: 'Put my name on it',
    description: 'Build your personal brand',
    example: 'Sarah Chen Coaching',
    icon: UserCheck,
    pros: ['Personal connection', 'Trust & credibility', 'You are the brand']
  },
  {
    id: 'anonymous',
    title: 'Keep it low-key',
    description: 'Stay behind the scenes',
    example: 'The Productivity Hub',
    icon: Eye,
    pros: ['Privacy & flexibility', 'Scalable business', 'Focus on the value']
  }
];

export const StepThree = ({ onNext, onBack, initialValue }: StepThreeProps) => {
  const [selectedNaming, setSelectedNaming] = useState(initialValue || '');

  const handleSubmit = () => {
    if (selectedNaming) {
      onNext(selectedNaming);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-orange rounded-full flex items-center justify-center animate-bounce-in">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Your name or stay anonymous? 🤔
        </h2>
        <p className="text-lg text-muted-foreground">
          Both approaches work great - pick what feels right for you
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {namingOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedNaming === option.id;
          
          return (
            <Card 
              key={option.id}
              className={`
                cursor-pointer transition-smooth hover:shadow-brand-md border-2
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-brand-md scale-[1.02]' 
                  : 'border-border hover:border-primary/30 hover:scale-[1.01]'
                }
              `}
              onClick={() => setSelectedNaming(option.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold">{option.title}</h3>
                      <p className="text-muted-foreground">{option.description}</p>
                      <p className="text-sm text-primary font-medium mt-1">
                        Example: {option.example}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {option.pros.map((pro, index) => (
                        <span 
                          key={index} 
                          className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                        >
                          ✓ {pro}
                        </span>
                      ))}
                    </div>
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

      {selectedNaming && (
        <div className="text-center mb-6 p-4 bg-gradient-subtle rounded-lg animate-fade-in">
          <p className="font-medium text-primary">
            Perfect! We'll create names that {selectedNaming === 'with_personal_name' ? 'feature your personal brand' : 'keep you behind the scenes'} ✨
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          size="lg" 
          className="flex-1 h-14 text-lg font-semibold"
          onClick={handleSubmit}
          disabled={!selectedNaming}
          variant="hero"
        >
          See my preview
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
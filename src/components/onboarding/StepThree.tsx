import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Palette, Sparkles } from 'lucide-react';
import { LivePreview } from './LivePreview';

interface StepThreeProps {
  onNext: (businessIdentity: { name: string; logo: string }) => void;
  onBack: () => void;
  initialValue?: { name?: string; logo?: string };
  idea?: string;
  aboutYou?: { firstName: string; expertise: string; style: string };
  audience?: string;
}

export const StepThree = ({ onNext, onBack, initialValue, idea, aboutYou, audience }: StepThreeProps) => {
  // Generate business name suggestions based on previous inputs
  const generateBusinessNames = () => {
    if (!idea || !aboutYou) return [];
    
    const { firstName, style } = aboutYou;
    const cleanIdea = idea.toLowerCase();
    
    const personalNames = firstName ? [
      `${firstName}'s ${cleanIdea.includes('guide') ? 'Guide' : 'Hub'}`,
      `${firstName} ${cleanIdea.includes('coaching') ? 'Coaching' : 'Academy'}`,
      `${firstName}'s ${style === 'playful' ? 'Creative' : style === 'professional' ? 'Consulting' : 'Community'}`
    ] : [];
    
    const anonymousNames = [
      `${style === 'playful' ? 'The Creative' : style === 'professional' ? 'The Expert' : 'The Friendly'} ${cleanIdea.includes('parent') ? 'Parent' : cleanIdea.includes('entrepreneur') ? 'Entrepreneur' : 'Learning'} Hub`,
      `${cleanIdea.includes('productivity') ? 'Productivity' : cleanIdea.includes('health') ? 'Wellness' : 'Success'} Mastery`,
      `${style === 'playful' ? 'Bright' : style === 'professional' ? 'Smart' : 'Simple'} ${cleanIdea.includes('business') ? 'Business' : cleanIdea.includes('life') ? 'Life' : 'Growth'} Solutions`
    ];
    
    return [...personalNames, ...anonymousNames].filter(Boolean).slice(0, 3);
  };

  const generateLogos = (name: string) => {
    const colors = [
      { bg: 'bg-gradient-to-br from-brand-teal to-brand-orange', icon: '🚀' },
      { bg: 'bg-gradient-to-br from-primary to-accent', icon: '✨' },
      { bg: 'bg-gradient-to-br from-brand-orange to-brand-teal', icon: '💡' }
    ];
    
    return colors.map((color, idx) => ({
      id: `logo-${idx}`,
      ...color,
      initial: name.charAt(0).toUpperCase()
    }));
  };

  const businessNames = generateBusinessNames();
  const [selectedName, setSelectedName] = useState(initialValue?.name || businessNames[0] || '');
  const [selectedLogo, setSelectedLogo] = useState(initialValue?.logo || 'logo-0');
  
  const logos = generateLogos(selectedName);

  const handleSubmit = () => {
    if (selectedName && selectedLogo) {
      onNext({ name: selectedName, logo: selectedLogo });
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-accent rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Choose Your Business Identity</h2>
        <p className="text-muted-foreground text-lg">
          Pick your business name and logo — see your full preview instantly!
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Side - Identity Selection */}
        <div className="space-y-6">
          {/* Business Name Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Palette className="w-5 h-5 text-primary" />
                <span>Choose Your Business Name</span>
              </h3>
              
              <div className="space-y-3">
                {businessNames.map((name, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedName === name
                        ? 'ring-2 ring-primary border-primary shadow-brand-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedName(name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">{name}</div>
                        <Badge variant="secondary" className="mt-1">
                          {name.includes(aboutYou?.firstName || '') ? 'Personal Brand' : 'Business Identity'}
                        </Badge>
                      </div>
                      {selectedName === name && (
                        <div className="p-1 rounded-full bg-primary">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Logo Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Choose Your Logo</h3>
              
              <div className="grid grid-cols-3 gap-4">
                {logos.map((logo) => (
                  <div
                    key={logo.id}
                    className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedLogo === logo.id
                        ? 'ring-4 ring-primary shadow-brand-md scale-105'
                        : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedLogo(logo.id)}
                  >
                    <div className={`w-full h-full ${logo.bg} rounded-lg flex items-center justify-center text-white text-2xl font-bold relative`}>
                      <span className="text-4xl">{logo.icon}</span>
                      <div className="absolute bottom-2 right-2 text-lg font-bold">
                        {logo.initial}
                      </div>
                      {selectedLogo === logo.id && (
                        <div className="absolute -top-2 -right-2 p-1 rounded-full bg-primary">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Live Preview */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-center">Your Business Preview</h3>
          {idea && aboutYou && audience && (
            <LivePreview
              idea={idea}
              aboutYou={aboutYou}
              audience={audience}
              businessIdentity={{ name: selectedName, logo: selectedLogo }}
            />
          )}
        </div>
      </div>

      {selectedName && selectedLogo && (
        <div className="mt-8 p-4 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
          <div className="flex items-center justify-center space-x-2 text-primary">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Perfect! Your business identity is ready to launch 🚀</span>
          </div>
        </div>
      )}

      <div className="flex space-x-3 mt-8">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          ← Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!selectedName || !selectedLogo}
          className="flex-1"
        >
          Launch My Business →
        </Button>
      </div>
    </div>
  );
};
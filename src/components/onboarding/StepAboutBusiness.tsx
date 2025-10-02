import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Baby, GraduationCap, Briefcase, Palette, MapPin, Globe, Heart, Target, Sparkles, Smile, Zap, BookOpen, Lightbulb, Rocket } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

interface StepAboutBusinessProps {
  onNext: (data: { vibes: string[]; audiences: string[] }) => void;
  onBack: () => void;
  initialVibes?: string[];
  initialAudiences?: string[];
  aboutYou?: {
    firstName?: string;
    lastName?: string;
    expertise?: string;
    motivation?: string;
    includeFirstName?: boolean;
    includeLastName?: boolean;
  };
  isLoading?: boolean;
}

const vibeOptions = [
  { id: 'professional', label: 'Professional', icon: Briefcase, color: 'from-blue-500 to-cyan-500', description: 'Clear, credible, trustworthy' },
  { id: 'playful', label: 'Playful', icon: Smile, color: 'from-pink-500 to-rose-500', description: 'Fun, energetic, approachable' },
  { id: 'bold', label: 'Bold', icon: Zap, color: 'from-purple-500 to-indigo-500', description: 'Confident, impactful, daring' },
  { id: 'visionary', label: 'Visionary', icon: Rocket, color: 'from-orange-500 to-amber-500', description: 'Future-focused, innovative' },
  { id: 'friendly', label: 'Friendly', icon: Heart, color: 'from-red-500 to-pink-500', description: 'Warm, welcoming, personal' },
  { id: 'educational', label: 'Educational', icon: BookOpen, color: 'from-green-500 to-emerald-500', description: 'Informative, clear, helpful' },
  { id: 'inspirational', label: 'Inspirational', icon: Lightbulb, color: 'from-yellow-500 to-amber-500', description: 'Motivating, uplifting, empowering' },
];

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

export const StepAboutBusiness = ({ 
  onNext, 
  onBack, 
  initialVibes = [], 
  initialAudiences = [],
  aboutYou,
  isLoading = false 
}: StepAboutBusinessProps) => {
  const [selectedVibes, setSelectedVibes] = useState<string[]>(initialVibes);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(initialAudiences);

  const toggleVibe = (vibeId: string) => {
    const newVibes = selectedVibes.includes(vibeId)
      ? selectedVibes.filter(id => id !== vibeId)
      : [...selectedVibes, vibeId];
    
    setSelectedVibes(newVibes);
    
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutBusiness',
      payload: { action: 'select_vibes', vibes: newVibes }
    });
  };

  const toggleAudience = (audienceId: string) => {
    const newAudiences = selectedAudiences.includes(audienceId)
      ? selectedAudiences.filter(id => id !== audienceId)
      : [...selectedAudiences, audienceId];
    
    setSelectedAudiences(newAudiences);
    
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutBusiness',
      payload: { action: 'select_audiences', audiences: newAudiences }
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (selectedVibes.length > 0 && selectedAudiences.length > 0) {
      onNext({ vibes: selectedVibes, audiences: selectedAudiences });
    }
  };

  const isValid = selectedVibes.length > 0 && selectedAudiences.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-8 px-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">About Your Business</h2>
        </div>
        <p className="text-base md:text-lg text-muted-foreground px-2">
          Tell us about your business vibe and who you'll serve
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Vibe & Style Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Vibe & Style
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              How do you want your business to feel? (Select all that apply)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {vibeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedVibes.includes(option.id);
              
              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleVibe(option.id)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col items-center text-center gap-1.5 md:gap-2">
                      <div className={`p-1.5 md:p-2 rounded-lg bg-gradient-to-br ${option.color} text-white`}>
                        <Icon className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs md:text-sm">{option.label}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">{option.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedVibes.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-sm font-medium text-muted-foreground">Selected vibes:</p>
              <div className="flex flex-wrap gap-2">
                {selectedVibes.map(id => {
                  const option = vibeOptions.find(o => o.id === id);
                  return option ? (
                    <Badge key={id} variant="default" className="text-sm py-1 px-3">
                      {option.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Target Audience Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Target Audience
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Who are you here to help? (Select all that apply)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
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
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col items-center text-center gap-1.5 md:gap-2">
                      <div className={`p-1.5 md:p-2 rounded-lg bg-gradient-to-br ${option.color} text-white`}>
                        <Icon className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs md:text-sm">{option.label}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">{option.description}</div>
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
            </div>
          )}
        </div>

        {isValid && (
          <div className="text-center animate-fade-in">
            <p className="text-xs md:text-sm text-primary font-medium px-2">
              🔥 Perfect! This will help us create content that resonates
            </p>
          </div>
        )}

        {/* Shopfront Bio Preview - Only show when both selections are complete */}
        {isValid && aboutYou && (aboutYou.motivation || aboutYou.expertise) && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 animate-fade-in">
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm md:text-base">Shopfront About preview</h3>
              </div>
              
              <div className="space-y-3">
                {aboutYou.motivation && (
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase mb-2">About</h4>
                    <p className="text-sm md:text-base leading-relaxed">
                      {aboutYou.motivation}
                    </p>
                  </div>
                )}
                
                {aboutYou.expertise && (
                  <div>
                    <p className="text-sm md:text-base leading-relaxed">
                      {aboutYou.expertise}
                    </p>
                  </div>
                )}
                
                {(aboutYou.firstName || aboutYou.lastName) && (aboutYou.includeFirstName || aboutYou.includeLastName) && (
                  <div>
                    <p className="text-sm text-muted-foreground italic">
                      By {aboutYou.includeFirstName ? aboutYou.firstName : ''}{' '}
                      {aboutYou.includeLastName ? aboutYou.lastName : ''}
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground italic pt-2 border-t border-primary/10">
                This is how your About section will appear in your shopfront.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            type="button"
            variant="secondary"
            size="default"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button 
            type="submit"
            size="lg"
            disabled={!isValid || isLoading}
            variant="hero"
            className="w-full h-14 text-lg font-semibold"
          >
            {isLoading ? 'Processing...' : 'Let\'s name your business →'}
          </Button>
          
          {isValid && (
            <p className="text-xs text-center text-muted-foreground px-2 animate-fade-in">
              Beautiful — your passion and story are the heart of your business. Now let's shape its personality and audience so it feels alive.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
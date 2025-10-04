import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Baby, GraduationCap, Briefcase, Palette, MapPin, Globe, Heart, Target, Sparkles, Smile, Zap, BookOpen, Lightbulb, Rocket, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { generateBusinessIdentity } from '@/lib/api';
import type { GenerateIdentityRequest } from '@/types/onboarding';
import { useToast } from '@/hooks/use-toast';

interface StepAboutBusinessProps {
  onNext: (data: { vibes: string[]; audiences: string[]; businessIdentity?: any }) => void;
  onBack: () => void;
  initialVibes?: string[];
  initialAudiences?: string[];
  idea?: string;
  aboutYou?: {
    firstName?: string;
    lastName?: string;
    expertise?: string;
    motivation?: string;
    includeFirstName?: boolean;
    includeLastName?: boolean;
  };
  businessIdentity?: {
    bio?: string;
    name?: string;
    tagline?: string;
    colors?: string[];
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
  idea = '',
  aboutYou,
  businessIdentity,
  isLoading = false 
}: StepAboutBusinessProps) => {
  const [selectedVibes, setSelectedVibes] = useState<string[]>(initialVibes);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(initialAudiences);
  const [generatedBio, setGeneratedBio] = useState<string | undefined>(businessIdentity?.bio);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bioFeedback, setBioFeedback] = useState<'up' | 'down' | null>(null);
  const { toast } = useToast();

  // Remove auto-generation - user triggers manually via CTA

  const generateBio = async () => {
    if (!aboutYou?.expertise || !aboutYou?.motivation || !idea) return;
    
    setIsGenerating(true);
    setBioFeedback(null);
    
    try {
      const request: GenerateIdentityRequest = {
        idea,
        audiences: selectedAudiences,
        vibes: selectedVibes,
        aboutYou: {
          firstName: aboutYou.firstName || '',
          lastName: aboutYou.lastName || '',
          expertise: aboutYou.expertise,
          motivation: aboutYou.motivation,
          includeFirstName: aboutYou.includeFirstName ?? true,
          includeLastName: aboutYou.includeLastName ?? true,
        },
      };

      logFrontendEvent({
        eventType: 'user_action',
        step: 'StepAboutBusiness',
        payload: { action: 'generate_bio', request }
      });

      const response = await generateBusinessIdentity(request);
      
      if (response.bio) {
        setGeneratedBio(response.bio);
        logFrontendEvent({
          eventType: 'user_action',
          step: 'StepAboutBusiness',
          payload: { action: 'bio_generated', bioLength: response.bio.length }
        });
      }
    } catch (error) {
      console.error('Failed to generate bio:', error);
      toast({
        title: "Couldn't generate bio",
        description: "We'll try again or you can refresh manually.",
        variant: "destructive"
      });
      logFrontendEvent({
        eventType: 'error',
        step: 'StepAboutBusiness',
        payload: { action: 'generate_bio_failed', error: String(error) }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshBio = () => {
    setGeneratedBio(undefined);
    generateBio();
  };

  const handleBioFeedback = (feedback: 'up' | 'down') => {
    setBioFeedback(feedback);
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutBusiness',
      payload: { action: 'bio_feedback', feedback }
    });
    
    if (feedback === 'up') {
      toast({
        title: "Bio saved!",
        description: "Your bio looks great and is ready to use.",
      });
    } else {
      // Thumbs down - regenerate the bio
      handleRefreshBio();
    }
  };

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

  const handleGenerateBio = () => {
    generateBio();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Pass the generated bio along with vibes and audiences
    onNext({ 
      vibes: selectedVibes, 
      audiences: selectedAudiences,
      businessIdentity: generatedBio ? {
        ...businessIdentity,
        bio: generatedBio
      } : businessIdentity
    });
  };

  const hasMinSelections = selectedVibes.length > 0 && selectedAudiences.length > 0;
  const hasBio = Boolean(generatedBio);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-8 px-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Your vibe and audience</h2>
        </div>
        <p className="text-base md:text-lg text-muted-foreground px-2">
          Tell us about your vibe and who you'll be selling to
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

        {hasMinSelections && !hasBio && (
          <div className="text-center animate-fade-in">
            <p className="text-xs md:text-sm text-primary font-medium px-2">
              🔥 Perfect! Ready to create your bio
            </p>
          </div>
        )}

        {/* Bio Preview Card - Only show after bio is generated */}
        {hasBio && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden animate-fade-in shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Your bio is ready</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBioFeedback('up')}
                    className={`h-8 w-8 p-0 ${bioFeedback === 'up' ? 'bg-green-500/10 text-green-600' : ''}`}
                    title="Like this bio"
                    disabled={isGenerating}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBioFeedback('down')}
                    className={`h-8 w-8 p-0 ${bioFeedback === 'down' ? 'bg-red-500/10 text-red-600' : ''}`}
                    title="Dislike - regenerate"
                    disabled={isGenerating}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshBio}
                    className="h-8 px-3 text-xs"
                    disabled={isGenerating}
                    title="Refresh bio"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              <p className="text-sm md:text-base leading-relaxed mb-4 text-foreground">{generatedBio}</p>

              {(selectedVibes.length > 0 || selectedAudiences.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedVibes.map(vibe => (
                    <Badge key={vibe} variant="secondary" className="text-xs">
                      {vibeOptions.find(v => v.id === vibe)?.label || vibe}
                    </Badge>
                  ))}
                  {selectedAudiences.map(audience => (
                    <Badge key={audience} variant="outline" className="text-xs">
                      {audienceOptions.find(a => a.id === audience)?.label || audience}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  ✨ This AI-generated bio will appear on your shopfront.
                </p>
                <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                  <p className="text-xs text-primary font-medium">
                    People will really connect to this.
                  </p>
                </div>
              </div>
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
          
          {!hasBio ? (
            <Button 
              type="button"
              size="lg"
              disabled={!hasMinSelections || isGenerating}
              variant="hero"
              className="w-full h-14 text-lg font-semibold"
              onClick={handleGenerateBio}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Creating your bio…
                </>
              ) : (
                'Great choices — let\'s create your bio →'
              )}
            </Button>
          ) : (
            <Button 
              type="submit"
              size="lg"
              disabled={isLoading}
              variant="hero"
              className="w-full h-auto py-3 text-lg font-semibold"
            >
              {isLoading ? 'Processing...' : (
                <div className="flex flex-col gap-0.5">
                  <span>Looks great</span>
                  <span>Let's name your business →</span>
                </div>
              )}
            </Button>
          )}
          
          {hasMinSelections && !hasBio && (
            <p className="text-xs text-center text-muted-foreground px-2 animate-fade-in">
              We'll use AI to craft a professional bio from your selections
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
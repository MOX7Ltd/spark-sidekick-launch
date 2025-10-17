import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, Baby, GraduationCap, Briefcase, Palette, MapPin, Globe, Heart, Target, Sparkles, Smile, Zap, BookOpen, Lightbulb, Rocket, ThumbsUp, ThumbsDown, AlertCircle, Check } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { generateBusinessIdentity } from '@/lib/api';
import type { GenerateIdentityRequest } from '@/types/onboarding';
import { useToast } from '@/hooks/use-toast';

interface StepAboutYouVibeProps {
  onNext: (data: { vibes: string[]; audiences: string[]; bio: string; bioLocked: boolean; bioAttempts: number; bioHistory: string[] }) => void;
  onBack: () => void;
  initialVibes?: string[];
  initialAudiences?: string[];
  initialBio?: string;
  initialBioLocked?: boolean;
  initialBioAttempts?: number;
  initialBioHistory?: string[];
  idea?: string;
  aboutYou?: {
    firstName?: string;
    lastName?: string;
    expertise?: string;
    motivation?: string;
    includeFirstName?: boolean;
    includeLastName?: boolean;
  };
  isLoading?: boolean;
  onAutoSave?: () => void;
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

export const StepAboutYouVibe = ({ 
  onNext, 
  onBack, 
  initialVibes = [], 
  initialAudiences = [],
  initialBio = '',
  initialBioLocked = false,
  initialBioAttempts = 0,
  initialBioHistory = [],
  idea = '',
  aboutYou,
  isLoading = false,
  onAutoSave
}: StepAboutYouVibeProps) => {
  const [selectedVibes, setSelectedVibes] = useState<string[]>(initialVibes);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(initialAudiences);
  const [generatedBio, setGeneratedBio] = useState<string>(initialBio);
  const [bioLocked, setBioLocked] = useState<boolean>(initialBioLocked);
  const [bioAttempts, setBioAttempts] = useState<number>(initialBioAttempts);
  const [bioHistory, setBioHistory] = useState<string[]>(initialBioHistory);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<'up' | 'down' | null>(null);
  const { toast } = useToast();

  // Auto-save on selection changes
  useEffect(() => {
    if (selectedVibes.length > 0 || selectedAudiences.length > 0) {
      onAutoSave?.();
    }
  }, [selectedVibes, selectedAudiences]);

  const generateBio = async () => {
    if (!aboutYou?.expertise || !aboutYou?.motivation || !idea) return;
    if (bioAttempts >= 3) return; // Max 3 attempts
    
    setIsGenerating(true);
    setCurrentFeedback(null);
    
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
        step: 'StepAboutYouVibe',
        payload: { action: `bio_generated_${bioAttempts + 1}`, request }
      });

      const response = await generateBusinessIdentity(request);
      
      if (response.bio) {
        setGeneratedBio(response.bio);
        setBioHistory(prev => [...prev, response.bio]);
        setBioAttempts(prev => prev + 1);
        
        logFrontendEvent({
          eventType: 'user_action',
          step: 'StepAboutYouVibe',
          payload: { action: 'bio_generated', attempt: bioAttempts + 1, bioLength: response.bio.length }
        });

        // Auto-lock on 3rd attempt
        if (bioAttempts + 1 >= 3) {
          setBioLocked(true);
          toast({
            title: "Bio locked",
            description: "You can refine it later in your Hub.",
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate bio:', error);
      toast({
        title: "Couldn't generate bio",
        description: "Please try again.",
        variant: "destructive"
      });
      logFrontendEvent({
        eventType: 'error',
        step: 'StepAboutYouVibe',
        payload: { action: 'generate_bio_failed', error: String(error) }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBioFeedback = (feedback: 'up' | 'down') => {
    setCurrentFeedback(feedback);
    
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutYouVibe',
      payload: { action: `bio_feedback_${feedback}`, attempt: bioAttempts }
    });
    
    if (feedback === 'up') {
      // Lock bio and show success
      setBioLocked(true);
      toast({
        title: "Bio saved!",
        description: "Your bio looks great and is ready to use.",
      });
    } else {
      // Generate new attempt
      if (bioAttempts < 3) {
        generateBio();
      }
    }
  };

  const handleKeep = () => {
    setBioLocked(true);
    setCurrentFeedback('up');
    toast({
      title: "Bio kept!",
      description: "We'll use this version.",
    });
  };

  const handleUndo = () => {
    if (bioHistory.length > 1) {
      const previousBio = bioHistory[bioHistory.length - 2];
      setGeneratedBio(previousBio);
      setBioHistory(prev => prev.slice(0, -1));
      setBioAttempts(prev => prev - 1);
      setCurrentFeedback(null);
    }
  };

  const handleReject = () => {
    if (bioAttempts < 3) {
      generateBio();
    }
  };

  const toggleVibe = (vibeId: string) => {
    const newVibes = selectedVibes.includes(vibeId)
      ? selectedVibes.filter(id => id !== vibeId)
      : [...selectedVibes, vibeId];
    
    setSelectedVibes(newVibes);
    
    logFrontendEvent({
      eventType: 'user_action',
      step: 'StepAboutYouVibe',
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
      step: 'StepAboutYouVibe',
      payload: { action: 'select_audiences', audiences: newAudiences }
    });
  };

  const handleGenerateBio = () => {
    if (bioAttempts === 0) {
      generateBio();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!bioLocked) {
      toast({
        title: "Please confirm your bio",
        description: "Give it a thumbs up or down to continue.",
        variant: "destructive"
      });
      return;
    }

    onNext({ 
      vibes: selectedVibes, 
      audiences: selectedAudiences,
      bio: generatedBio,
      bioLocked,
      bioAttempts,
      bioHistory
    });
  };

  const hasMinSelections = selectedVibes.length > 0 && selectedAudiences.length > 0;
  const hasBio = Boolean(generatedBio);
  const canGenerate = hasMinSelections && bioAttempts < 3 && !isGenerating;

  // Determine button state
  const showAttempt1Buttons = bioAttempts === 1 && !bioLocked;
  const showAttempt2Buttons = bioAttempts === 2 && !bioLocked;

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
                  onClick={() => !bioLocked && toggleVibe(option.id)}
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
                  onClick={() => !bioLocked && toggleAudience(option.id)}
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

        {/* Guidance for attempt 2 */}
        {bioAttempts === 2 && !bioLocked && (
          <Alert className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Try adjusting your vibe or audience for a different tone.
            </AlertDescription>
          </Alert>
        )}

        {/* Guidance for attempt 3 (locked) */}
        {bioAttempts >= 3 && bioLocked && (
          <Alert className="animate-fade-in border-primary/50 bg-primary/5">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              We'll keep this one for now — you can refine it later in your Hub.
            </AlertDescription>
          </Alert>
        )}

        {hasMinSelections && !hasBio && (
          <div className="text-center animate-fade-in">
            <p className="text-xs md:text-sm text-primary font-medium px-2">
              🔥 Perfect! Ready to create your bio
            </p>
          </div>
        )}

        {/* Bio Preview Card */}
        {hasBio && (
          <Card className={`border-2 overflow-hidden animate-fade-in shadow-lg ${
            bioLocked 
              ? 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5' 
              : 'border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5'
          }`}>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {bioLocked ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {bioLocked ? 'Bio confirmed!' : 'Your bio is ready'}
                  </h3>
                </div>
                
                {!bioLocked && (
                  <div className="flex items-center gap-2">
                    {showAttempt1Buttons && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBioFeedback('up')}
                          className="h-8 w-8 p-0"
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
                          className="h-8 w-8 p-0"
                          title="Generate another"
                          disabled={isGenerating}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {showAttempt2Buttons && (
                      <>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={handleKeep}
                          disabled={isGenerating}
                        >
                          Keep
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUndo}
                          disabled={isGenerating || bioHistory.length < 2}
                        >
                          Undo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleReject}
                          disabled={isGenerating}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                )}
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
                {!bioLocked && bioAttempts > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Attempt {bioAttempts} of 3
                  </div>
                )}
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
            disabled={isLoading || isGenerating}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {!hasBio ? (
            <Button 
              type="button"
              size="default"
              onClick={handleGenerateBio}
              disabled={!canGenerate || isLoading}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  Creating your bio...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate My Bio
                </>
              )}
            </Button>
          ) : (
            <Button 
              type="submit"
              size="default"
              disabled={!bioLocked || isLoading || isGenerating}
              className="w-full"
            >
              Continue
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

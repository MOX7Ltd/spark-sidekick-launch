import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Check, Palette, Lightbulb, Sparkles, Zap, Target, Heart, Star, 
  Hexagon, RefreshCw, Loader2, ThumbsUp, ThumbsDown, ArrowLeft, 
  Briefcase, Smile, Minimize2, Eye, User, Upload
} from 'lucide-react';
import { regenerateBusinessNames, regenerateSingleName, generateLogos, generateBusinessIdentity, type NameSuggestion as ApiNameSuggestion } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface NameSuggestion {
  name: string;
  style?: string;
  archetype?: string;
  tagline: string;
}

interface StepBusinessIdentityProps {
  onNext: (businessIdentity: { 
    name: string; 
    logo: string; 
    tagline: string; 
    bio: string; 
    colors: string[]; 
    logoSVG: string; 
    nameOptions: NameSuggestion[];
    logoSource?: 'uploaded' | 'generated';
  }) => void;
  onBack: () => void;
  initialValue?: { 
    name: string; 
    logo: string; 
    tagline?: string; 
    bio?: string; 
    colors?: string[]; 
    logoSVG?: string; 
    nameOptions?: NameSuggestion[];
    logoSource?: 'uploaded' | 'generated';
  };
  idea: string;
  aboutYou: {
    firstName: string;
    lastName: string;
    expertise: string;
    motivation: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  };
  audience: string;
  vibes?: string[];
}

const nameStyleOptions = [
  { id: 'professional', name: 'Professional', icon: Briefcase, description: 'Clear, credible, and trustworthy' },
  { id: 'playful', name: 'Playful', icon: Smile, description: 'Fun, approachable, and energetic' },
  { id: 'minimalist', name: 'Minimalist', icon: Minimize2, description: 'Clean, simple, and modern' },
  { id: 'visionary', name: 'Visionary', icon: Eye, description: 'Bold, future-focused, and innovative' },
  { id: 'personal', name: 'Personal', icon: User, description: 'Built around your name and story' },
];

const logoStyles = [
  { id: 'modern', name: 'Minimalist', gradient: 'from-slate-600 to-slate-800', icon: Lightbulb },
  { id: 'playful', name: 'Playful', gradient: 'from-pink-500 to-orange-400', icon: Sparkles },
  { id: 'bold', name: 'Bold', gradient: 'from-purple-600 to-indigo-600', icon: Zap },
  { id: 'professional', name: 'Clean Professional', gradient: 'from-blue-600 to-blue-800', icon: Target },
  { id: 'icon', name: 'Icon-Based', gradient: 'from-teal-500 to-cyan-600', icon: Heart },
  { id: 'retro', name: 'Retro', gradient: 'from-amber-600 to-red-600', icon: Star },
];

export const StepBusinessIdentity = ({ onNext, onBack, initialValue, idea, aboutYou, audience, vibes = [] }: StepBusinessIdentityProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasExistingName, setHasExistingName] = useState<boolean | null>(null);
  const [existingName, setExistingName] = useState('');
  const [selectedNameStyle, setSelectedNameStyle] = useState('');
  const [nameOptions, setNameOptions] = useState<NameSuggestion[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [hasExistingLogo, setHasExistingLogo] = useState<boolean | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState('');
  const [selectedLogoStyle, setSelectedLogoStyle] = useState('');
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);
  const [selectedLogoIndex, setSelectedLogoIndex] = useState<number | null>(null);
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regeneratingLogoIndex, setRegeneratingLogoIndex] = useState<number | null>(null);
  const [likedNames, setLikedNames] = useState<Set<string>>(new Set());
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [likedLogos, setLikedLogos] = useState<Set<number>>(new Set());
  const [generatedBio, setGeneratedBio] = useState<string>('');
  const [generatedColors, setGeneratedColors] = useState<string[]>([]);
  const { toast } = useToast();

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Step 1: Do you have a business name?
  const handleHasNameChoice = async (hasName: boolean) => {
    setHasExistingName(hasName);
    if (hasName) {
      setCurrentStep(1.5); // Go to existing name input
    } else {
      setCurrentStep(2); // Go to name style selection
    }
  };

  // Step 1.5: Enter existing name and generate alternatives + full identity (bio, colors)
  const handleExistingNameSubmit = async () => {
    if (!existingName.trim()) return;
    
    setIsGeneratingNames(true);
    try {
      // Call full identity generation to get bio, colors, and alternative names
      const fullIdentity = await generateBusinessIdentity({
        idea,
        audience,
        experience: aboutYou.expertise,
        motivation: aboutYou.motivation,
        firstName: aboutYou.firstName,
        lastName: aboutYou.lastName,
        includeFirstName: aboutYou.includeFirstName,
        includeLastName: aboutYou.includeLastName,
        tone: vibes.join(', '),
        namingPreference: 'anonymous',
        bannedWords: [],
        rejectedNames: [existingName]
      });
      
      // Store the generated bio and colors for later use
      setGeneratedBio(fullIdentity.bio || '');
      setGeneratedColors(fullIdentity.colors || ['#6B7280', '#374151', '#1F2937']);
      setNameOptions(fullIdentity.nameOptions || []);
      setSelectedName(existingName); // Pre-select their existing name
      setCurrentStep(3); // Go to name selection
      
      toast({
        title: "Great choice! ✨",
        description: "Here are some alternative ideas inspired by your name"
      });
    } catch (error) {
      toast({
        title: "Failed to generate alternatives",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingNames(false);
    }
  };

  // Step 2: Generate names based on style + fetch full identity (bio, colors)
  const handleNameStyleSelect = async (styleId: string) => {
    setSelectedNameStyle(styleId);
    setIsGeneratingNames(true);
    
    try {
      // Call full identity generation to get bio, colors, and names
      const fullIdentity = await generateBusinessIdentity({
        idea,
        audience,
        experience: aboutYou.expertise,
        motivation: aboutYou.motivation,
        firstName: aboutYou.firstName,
        lastName: aboutYou.lastName,
        includeFirstName: aboutYou.includeFirstName,
        includeLastName: aboutYou.includeLastName,
        tone: vibes.join(', '),
        namingPreference: styleId === 'personal' ? 'with_personal_name' : 'anonymous',
        bannedWords: [],
        rejectedNames: []
      });
      
      // Store the generated bio and colors for later use
      setGeneratedBio(fullIdentity.bio || '');
      setGeneratedColors(fullIdentity.colors || ['#6B7280', '#374151', '#1F2937']);
      setNameOptions(fullIdentity.nameOptions || []);
      setCurrentStep(3); // Go to name selection
    } catch (error) {
      toast({
        title: "Failed to generate names",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingNames(false);
    }
  };

  // Step 3: Name selection actions
  const handleRegenerateNames = async () => {
    setIsGeneratingNames(true);
    try {
      const newNames = await regenerateBusinessNames({
        idea,
        audience,
        experience: aboutYou.expertise,
        motivation: aboutYou.motivation,
        firstName: aboutYou.firstName,
        lastName: aboutYou.lastName,
        includeFirstName: aboutYou.includeFirstName,
        includeLastName: aboutYou.includeLastName,
        tone: vibes.join(', '),
        namingPreference: selectedNameStyle === 'personal' ? 'with_personal_name' : 'anonymous',
        bannedWords,
        rejectedNames
      });
      
      setNameOptions(newNames);
      toast({
        title: "✨ Fresh ideas just for you!",
        description: "New name suggestions generated"
      });
    } catch (error) {
      toast({
        title: "Failed to regenerate names",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingNames(false);
    }
  };

  const handleRejectName = async (index: number) => {
    const rejectedOption = nameOptions[index];
    const wordsInName = rejectedOption.name.split(/\s+/);
    
    setRejectedNames(prev => [...prev, rejectedOption.name]);
    setBannedWords(prev => [...new Set([...prev, ...wordsInName])]);
    setLikedNames(prev => {
      const newSet = new Set(prev);
      newSet.delete(rejectedOption.name);
      return newSet;
    });
    
    setRegeneratingIndex(index);
    
    try {
      const existingNames = nameOptions.map(opt => opt.name).filter((_, i) => i !== index);
      
      const newName = await regenerateSingleName({
        idea,
        audience,
        experience: aboutYou.expertise,
        motivation: aboutYou.motivation,
        firstName: aboutYou.firstName,
        lastName: aboutYou.lastName,
        includeFirstName: aboutYou.includeFirstName,
        includeLastName: aboutYou.includeLastName,
        tone: vibes.join(', '),
        namingPreference: selectedNameStyle === 'personal' ? 'with_personal_name' : 'anonymous',
        bannedWords: [...bannedWords, ...wordsInName],
        rejectedNames: [...rejectedNames, rejectedOption.name, ...existingNames]
      });
      
      if (!existingNames.includes(newName.name)) {
        setNameOptions(prev => {
          const updated = [...prev];
          updated[index] = newName;
          return updated;
        });
        
        toast({
          title: "✨ Fresh name generated!",
          description: "Let us know if you like this one better"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to generate replacement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleLikeName = (name: string) => {
    setLikedNames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const handleNameConfirm = () => {
    if (!selectedName) return;
    setCurrentStep(4); // Go to "Do you have a logo?" question
  };

  // Step 4: Do you have a logo?
  const handleHasLogoChoice = (hasLogo: boolean) => {
    setHasExistingLogo(hasLogo);
    if (hasLogo) {
      setCurrentStep(4.5); // Go to logo upload
    } else {
      setCurrentStep(5); // Go to logo style selection
    }
  };

  // Step 4.5: Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedLogo(reader.result as string);
        toast({
          title: "✨ Logo uploaded!",
          description: "You can continue or change it later"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadedLogoSubmit = () => {
    if (!uploadedLogo) return;
    const selectedNameOption = nameOptions.find(opt => opt.name === selectedName);
    
    // Generate complementary color palette for uploaded logo
    const uploadedColors = ['#6B7280', '#9CA3AF', '#D1D5DB']; // Neutral grey palette
    
    onNext({
      name: selectedName,
      logo: 'uploaded',
      tagline: selectedNameOption?.tagline || 'Helping you succeed',
      bio: generatedBio || aboutYou.expertise,
      colors: uploadedColors,
      logoSVG: uploadedLogo,
      nameOptions: nameOptions,
      logoSource: 'uploaded'
    });
  };

  // Step 5: Logo style selection and generation
  const handleLogoStyleSelect = async (styleId: string) => {
    setSelectedLogoStyle(styleId);
    setIsGeneratingLogos(true);
    
    try {
      const logos = await generateLogos(selectedName, styleId);
      setGeneratedLogos(logos);
      setSelectedLogoIndex(null);
      setLikedLogos(new Set());
      setCurrentStep(6); // Go to logo selection
      
      toast({
        title: "🎨 Logos generated!",
        description: "Pick your favorite"
      });
    } catch (error) {
      toast({
        title: "Failed to generate logos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLogos(false);
    }
  };

  // Step 6: Logo selection actions
  const handleRegenerateLogos = async () => {
    if (!selectedLogoStyle) return;
    
    setIsGeneratingLogos(true);
    try {
      const logos = await generateLogos(selectedName, selectedLogoStyle);
      setGeneratedLogos(logos);
      setSelectedLogoIndex(null);
      setLikedLogos(new Set());
      
      toast({
        title: "✨ Fresh logos just for you!",
        description: "New logo options generated"
      });
    } catch (error) {
      toast({
        title: "Failed to regenerate logos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLogos(false);
    }
  };

  const handleRejectLogo = async (index: number) => {
    setRegeneratingLogoIndex(index);
    
    try {
      const newLogos = await generateLogos(selectedName, selectedLogoStyle);
      
      setGeneratedLogos(prev => {
        const updated = [...prev];
        updated[index] = newLogos[0];
        return updated;
      });
      
      setLikedLogos(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      
      if (selectedLogoIndex === index) {
        setSelectedLogoIndex(null);
      }
      
      toast({
        title: "✨ Fresh logo generated!",
        description: "Let us know if you like this one better"
      });
    } catch (error) {
      toast({
        title: "Failed to generate replacement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRegeneratingLogoIndex(null);
    }
  };

  const handleLikeLogo = (index: number) => {
    setLikedLogos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleLogoConfirm = () => {
    if (selectedLogoIndex === null) return;
    
    const finalLogo = generatedLogos[selectedLogoIndex];
    const selectedNameOption = nameOptions.find(opt => opt.name === selectedName);
    
    onNext({
      name: selectedName,
      logo: selectedLogoStyle,
      tagline: selectedNameOption?.tagline || 'Helping you succeed',
      bio: generatedBio || aboutYou.expertise,
      colors: generatedColors.length > 0 ? generatedColors : ['#6B7280', '#374151', '#1F2937'],
      logoSVG: finalLogo,
      nameOptions: nameOptions,
      logoSource: 'generated'
    });
  };

  const canProceed = () => {
    if (currentStep === 1) return hasExistingName !== null;
    if (currentStep === 1.5) return existingName.trim().length > 0;
    if (currentStep === 2) return selectedNameStyle !== '';
    if (currentStep === 3) return selectedName !== '';
    if (currentStep === 4) return hasExistingLogo !== null;
    if (currentStep === 4.5) return uploadedLogo !== '';
    if (currentStep === 5) return selectedLogoStyle !== '';
    if (currentStep === 6) return selectedLogoIndex !== null;
    return false;
  };

  return (
    <div className="w-full max-w-screen-sm mx-auto px-3 sm:px-4 py-6 animate-fade-in">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">Business Identity</span>
          <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step 1: Do you have a business name? */}
      {currentStep === 1 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-center break-words">Do you already have a business name?</h3>
              <p className="text-sm text-muted-foreground text-center">
                We can help you polish it or create something fresh
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleHasNameChoice(true)}
                variant="outline"
                className="w-full h-auto py-3 sm:py-4 text-left justify-start hover:border-primary hover:bg-primary/5 max-w-full"
              >
                <div className="break-words max-w-full">
                  <div className="font-semibold mb-1 text-sm sm:text-base">Yes, I have a name</div>
                  <div className="text-xs text-muted-foreground">I'll show you alternatives too</div>
                </div>
              </Button>

              <Button
                onClick={() => handleHasNameChoice(false)}
                variant="outline"
                className="w-full h-auto py-3 sm:py-4 text-left justify-start hover:border-primary hover:bg-primary/5 max-w-full"
              >
                <div className="break-words max-w-full">
                  <div className="font-semibold mb-1 text-sm sm:text-base">No, help me create one</div>
                  <div className="text-xs text-muted-foreground">Let's brainstorm together</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1.5: Enter existing name */}
      {currentStep === 1.5 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold break-words">What's your business name?</h3>
              <p className="text-sm text-muted-foreground">
                We'll also show you some alternative ideas — just in case!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="existingName">Business Name</Label>
              <Input
                id="existingName"
                value={existingName}
                onChange={(e) => setExistingName(e.target.value)}
                placeholder="Enter your business name"
                className="text-lg"
                autoFocus
              />
            </div>

            {existingName && (
              <p className="text-sm text-primary font-medium animate-fade-in">
                Perfect — that's going to look great! ✨
              </p>
            )}

            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1 whitespace-nowrap"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleExistingNameSubmit}
                disabled={!canProceed() || isGeneratingNames}
                className="flex-1 whitespace-nowrap"
              >
                {isGeneratingNames ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                    <span className="sm:hidden">Gen...</span>
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Name style selection */}
      {currentStep === 2 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold break-words">What vibe should your business name have?</h3>
              <p className="text-sm text-muted-foreground">
                This helps us create names that feel right for you
              </p>
            </div>

            <div className="space-y-2">
              {nameStyleOptions.map((style) => {
                const Icon = style.icon;
                return (
                  <Button
                    key={style.id}
                    onClick={() => handleNameStyleSelect(style.id)}
                    disabled={isGeneratingNames}
                    variant="outline"
                    className={`w-full h-auto py-3 sm:py-4 text-left justify-start hover:border-primary hover:bg-primary/5 max-w-full ${
                      isGeneratingNames ? 'opacity-50' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold mb-1 text-sm sm:text-base break-words">{style.name}</div>
                      <div className="text-xs text-muted-foreground break-words">{style.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {isGeneratingNames && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Creating your name options...</span>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Name selection */}
      {currentStep === 3 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl sm:text-2xl font-bold break-words">Pick your favorite name</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateNames}
                  disabled={isGeneratingNames}
                  className="text-xs self-start sm:self-auto whitespace-nowrap"
                >
                  {isGeneratingNames ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Tap 👍 to save ideas you like, 👎 to replace
              </p>
            </div>

            <div className="space-y-3">
              {/* Show existing name if entered */}
              {hasExistingName && existingName && (
                <div
                  className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all max-w-full ${
                    selectedName === existingName ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedName(existingName)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base sm:text-lg break-words">{existingName}</span>
                        {selectedName === existingName && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground break-words">Your original name</p>
                    </div>
                  </div>
                </div>
              )}

              {nameOptions.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all relative max-w-full ${
                    selectedName === option.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  } ${regeneratingIndex === index ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {regeneratingIndex === index && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                  <div 
                    className="cursor-pointer"
                    onClick={() => setSelectedName(option.name)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-base sm:text-lg break-words">{option.name}</span>
                          {selectedName === option.name && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground italic mb-2 break-words">{option.tagline}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 whitespace-nowrap ${likedNames.has(option.name) ? 'text-green-600 bg-green-50' : 'text-muted-foreground'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeName(option.name);
                          }}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectName(index);
                          }}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedName && (
              <p className="text-sm text-primary font-medium animate-fade-in text-center">
                Perfect choice — that's going to look great! 🔥
              </p>
            )}

            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(hasExistingName ? 1.5 : 2)}
                className="flex-1 whitespace-nowrap"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNameConfirm}
                disabled={!canProceed()}
                className="flex-1 whitespace-nowrap"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Do you already have a logo? */}
      {currentStep === 4 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-center break-words">Do you already have a logo?</h3>
              <p className="text-sm text-muted-foreground text-center">
                We can use yours or help you create something perfect
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleHasLogoChoice(true)}
                variant="outline"
                className="w-full h-auto py-3 sm:py-4 text-left justify-start hover:border-primary hover:bg-primary/5 max-w-full"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="break-words max-w-full">
                  <div className="font-semibold mb-1 text-sm sm:text-base">Yes, I have a logo</div>
                  <div className="text-xs text-muted-foreground">Upload your existing logo file</div>
                </div>
              </Button>

              <Button
                onClick={() => handleHasLogoChoice(false)}
                variant="outline"
                className="w-full h-auto py-3 sm:py-4 text-left justify-start hover:border-primary hover:bg-primary/5 max-w-full"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="break-words max-w-full">
                  <div className="font-semibold mb-1 text-sm sm:text-base">No, help me create one</div>
                  <div className="text-xs text-muted-foreground">We'll generate beautiful options</div>
                </div>
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="w-full mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4.5: Upload logo */}
      {currentStep === 4.5 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold break-words">Upload your logo</h3>
              <p className="text-sm text-muted-foreground">
                Choose a PNG, JPG, or SVG file
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  {uploadedLogo ? (
                    <div className="space-y-3">
                      <img src={uploadedLogo} alt="Uploaded logo" className="max-h-32 mx-auto object-contain" />
                      <p className="text-sm text-primary font-medium">Logo uploaded! Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, or SVG</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {uploadedLogo && (
                <p className="text-sm text-primary font-medium text-center animate-fade-in">
                  Perfect! You're all set ✨
                </p>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(4)}
                className="flex-1 whitespace-nowrap"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleUploadedLogoSubmit}
                disabled={!canProceed()}
                className="flex-1 whitespace-nowrap"
              >
                <span className="hidden sm:inline">See Your Business 💡</span>
                <span className="sm:hidden">See It 💡</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Logo style selection */}
      {currentStep === 5 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold break-words">Choose your logo style</h3>
              <p className="text-sm text-muted-foreground">
                Pick a style that matches {selectedName}
              </p>
            </div>

            <div className="space-y-2">
              {logoStyles.map((logo) => {
                const Icon = logo.icon;
                return (
                  <Button
                    key={logo.id}
                    onClick={() => handleLogoStyleSelect(logo.id)}
                    disabled={isGeneratingLogos}
                    variant="outline"
                    className={`w-full h-auto py-3 text-left justify-start hover:border-primary hover:bg-primary/5 max-w-full ${
                      isGeneratingLogos ? 'opacity-50' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${logo.gradient} flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base break-words">{logo.name}</div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {isGeneratingLogos && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Creating your logo options...</span>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setCurrentStep(4)}
              disabled={isGeneratingLogos}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Logo selection with feedback */}
      {currentStep === 6 && (
        <Card className="border-2 max-w-full">
          <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 max-w-full">
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl sm:text-2xl font-bold break-words">Pick your favorite logo</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateLogos}
                  disabled={isGeneratingLogos}
                  className="text-xs self-start sm:self-auto whitespace-nowrap"
                >
                  {isGeneratingLogos ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Tap 👍 to save ideas you like, 👎 to replace
              </p>
            </div>

            <div className="space-y-3">
              {generatedLogos.map((logo, idx) => (
                <Card
                  key={idx}
                  className={`border-2 transition-all hover:shadow-md max-w-full ${
                    selectedLogoIndex === idx ? 'border-primary bg-primary/5' : 'border-border'
                  } ${regeneratingLogoIndex === idx ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-3 sm:p-4 max-w-full">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedLogoIndex(idx)}
                    >
                      {/* Logo Preview */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-muted rounded-lg flex-shrink-0">
                        <img src={logo} alt={`Logo ${idx + 1}`} className="max-w-full max-h-full object-contain p-2" />
                      </div>

                      {/* Logo Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium break-words">Logo Option {idx + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedLogoIndex === idx ? 'Selected' : 'Tap to select'}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      {selectedLogoIndex === idx && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Feedback Controls */}
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant={likedLogos.has(idx) ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeLogo(idx);
                        }}
                        className="flex-1 h-8 text-xs"
                      >
                        <ThumbsUp className={`h-3 w-3 mr-1 flex-shrink-0 ${likedLogos.has(idx) ? 'fill-current' : ''}`} />
                        <span className="hidden sm:inline">Like</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectLogo(idx);
                        }}
                        disabled={regeneratingLogoIndex === idx}
                        className="flex-1 h-8 text-xs"
                      >
                        {regeneratingLogoIndex === idx ? (
                          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                        ) : (
                          <>
                            <ThumbsDown className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="hidden sm:inline">Replace</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedLogoIndex !== null && (
              <p className="text-sm text-primary font-medium text-center animate-fade-in">
                ✨ Perfect choice! Ready to see your business come to life?
              </p>
            )}

            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(5)}
                disabled={isGeneratingLogos}
                className="flex-1 whitespace-nowrap"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleLogoConfirm}
                disabled={!canProceed()}
                className="flex-1"
              >
                <span className="hidden sm:inline">See Your Business 💡</span>
                <span className="sm:hidden">See It 💡</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back to Stage 2 */}
      {currentStep === 1 && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to About You
        </Button>
      )}
    </div>
  );
};

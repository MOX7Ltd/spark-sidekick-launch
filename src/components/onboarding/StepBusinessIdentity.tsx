import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Check, Palette, Lightbulb, Sparkles, Zap, Heart, 
  RefreshCw, Loader2, ThumbsUp, ThumbsDown, ArrowLeft, Upload,
  Circle, Smile, Target, Paintbrush, Clock, TrendingUp, Type
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { regenerateBusinessNames, regenerateSingleName, generateLogos, generateBusinessIdentity } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { BusinessIdentity, AboutYou } from '@/types/onboarding';

interface StepBusinessIdentityProps {
  onNext: (businessIdentity: BusinessIdentity) => void;
  onBack: () => void;
  initialValue?: Partial<BusinessIdentity>;
  idea: string;
  aboutYou: AboutYou;
  audiences: string[];
  vibes: string[];
}

// Expanded logo styles for more variety
const logoStyles = [
  { 
    id: 'minimalist', 
    name: 'Minimalist', 
    description: 'Clean, simple, modern',
    gradient: 'from-slate-600 to-slate-800', 
    icon: Circle 
  },
  { 
    id: 'playful', 
    name: 'Playful', 
    description: 'Fun, lighthearted, energetic',
    gradient: 'from-pink-500 to-orange-400', 
    icon: Smile 
  },
  { 
    id: 'bold', 
    name: 'Bold', 
    description: 'Confident, high impact, daring',
    gradient: 'from-purple-600 to-indigo-600', 
    icon: Zap 
  },
  { 
    id: 'icon', 
    name: 'Icon-Based', 
    description: 'Strong symbol-driven design',
    gradient: 'from-teal-500 to-cyan-600', 
    icon: Target 
  },
  { 
    id: 'handdrawn', 
    name: 'Hand-drawn', 
    description: 'Sketch-style, creative, personal',
    gradient: 'from-amber-500 to-orange-600', 
    icon: Paintbrush 
  },
  { 
    id: 'retro', 
    name: 'Retro', 
    description: 'Vintage, nostalgic, classic',
    gradient: 'from-rose-500 to-red-600', 
    icon: Clock 
  },
  { 
    id: 'gradient', 
    name: 'Modern Gradient', 
    description: 'Colorful, tech-forward, trendy',
    gradient: 'from-blue-500 to-purple-600', 
    icon: TrendingUp 
  },
  { 
    id: 'typography', 
    name: 'Typography-First', 
    description: 'Strong wordmark focus',
    gradient: 'from-gray-700 to-gray-900', 
    icon: Type 
  },
];

export const StepBusinessIdentity = ({ onNext, onBack, initialValue, idea, aboutYou, audiences, vibes = [] }: StepBusinessIdentityProps) => {
  // Name states
  const [nameSection, setNameSection] = useState<'choice' | 'existing' | 'generate' | 'select'>('choice');
  const [hasExistingName, setHasExistingName] = useState<boolean | null>(null);
  const [existingName, setExistingName] = useState('');
  const [nameOptions, setNameOptions] = useState<BusinessIdentity['nameOptions']>([]);
  const [selectedName, setSelectedName] = useState('');
  const [isGeneratingNames, setIsGeneratingNames] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [likedNames, setLikedNames] = useState<Set<string>>(new Set());
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>(() => {
    const banned: string[] = [];
    if (!aboutYou.includeFirstName && aboutYou.firstName) {
      banned.push(aboutYou.firstName.toLowerCase());
    }
    if (!aboutYou.includeLastName && aboutYou.lastName) {
      banned.push(aboutYou.lastName.toLowerCase());
    }
    return banned;
  });

// Logo states
  const [logoSection, setLogoSection] = useState<'hidden' | 'choice' | 'upload' | 'generate' | 'select'>('hidden');
  const [hasExistingLogo, setHasExistingLogo] = useState<boolean | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState('');
  const [selectedLogoStyle, setSelectedLogoStyle] = useState('');
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);
  const [selectedLogoIndex, setSelectedLogoIndex] = useState<number | null>(null);
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const [regeneratingLogoIndex, setRegeneratingLogoIndex] = useState<number | null>(null);
  const [likedLogos, setLikedLogos] = useState<Set<number>>(new Set());
  
  // Descriptive logo nicknames
  const logoNicknames = ['Clean & Bold', 'Playful Energy', 'Visionary Spark', 'Creative Edge'];

  // Shared states for bio and colors
  const [generatedBio, setGeneratedBio] = useState<string>('');
  const [generatedColors, setGeneratedColors] = useState<string[]>([]);
  const { toast } = useToast();

  // Name: Handle "Do you have a name?" choice
  const handleHasNameChoice = async (hasName: boolean) => {
    setHasExistingName(hasName);
    if (hasName) {
      setNameSection('existing');
    } else {
      setNameSection('generate');
      // Auto-generate names using vibes from Step 3
      await generateNames();
    }
  };

  // Name: Generate names using vibes from Step 3 (no duplicate vibe screen)
  const generateNames = async () => {
    setIsGeneratingNames(true);
    try {
      const fullIdentity = await generateBusinessIdentity({
        idea,
        audiences,
        vibes, // Use vibes from Step 3
        aboutYou,
        bannedWords,
        rejectedNames: []
      });
      
      setGeneratedBio(fullIdentity.bio || '');
      setGeneratedColors(fullIdentity.colors || []);
      // Limit to 4 options for mobile-friendliness
      setNameOptions((fullIdentity.nameOptions || []).slice(0, 4));
      setNameSection('select');
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

  // Name: Submit existing name and generate alternatives
  const handleExistingNameSubmit = async () => {
    if (!existingName.trim()) return;
    
    setIsGeneratingNames(true);
    try {
      const fullIdentity = await generateBusinessIdentity({
        idea,
        audiences,
        vibes, // Use vibes from Step 3
        aboutYou,
        rejectedNames: [existingName],
        bannedWords
      });
      
      setGeneratedBio(fullIdentity.bio || '');
      setGeneratedColors(fullIdentity.colors || []);
      // Limit to 4 options for mobile-friendliness
      setNameOptions((fullIdentity.nameOptions || []).slice(0, 4));
      setSelectedName(existingName);
      setNameSection('select');
      
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

  // Name: Regenerate all names
  const handleRegenerateNames = async () => {
    setIsGeneratingNames(true);
    try {
      const newNames = await regenerateBusinessNames({
        idea,
        audiences,
        vibes, // Use vibes from Step 3
        aboutYou,
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

  // Name: Reject and replace single name
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
        audiences,
        vibes, // Use vibes from Step 3
        aboutYou,
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

  // Name: Toggle like
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

  // Name: Confirm selection and show logo section
  const handleNameConfirm = () => {
    if (!selectedName) return;
    toast({
      title: "🎉 That's a strong brand name!",
      description: "Let's design the perfect logo to match."
    });
    setLogoSection('choice');
  };

  // Logo: Handle "Do you have a logo?" choice
  const handleHasLogoChoice = (hasLogo: boolean) => {
    setHasExistingLogo(hasLogo);
    if (hasLogo) {
      setLogoSection('upload');
    } else {
      setLogoSection('generate');
    }
  };

  // Logo: Handle file upload
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

  // Logo: Submit uploaded logo
  const handleUploadedLogoSubmit = () => {
    if (!uploadedLogo) return;
    const selectedNameOption = nameOptions.find(opt => opt.name === selectedName);
    
    onNext({
      name: selectedName,
      nameOptions,
      tagline: selectedNameOption?.tagline || 'Helping you succeed',
      bio: generatedBio || aboutYou.expertise,
      colors: generatedColors.length > 0 ? generatedColors : [],
      logoUrl: uploadedLogo,
      logoSVG: uploadedLogo,
      logoSource: 'uploaded'
    });
  };

  // Logo: Generate logos with selected style
  const handleLogoStyleSelect = async (styleId: string) => {
    setSelectedLogoStyle(styleId);
    setIsGeneratingLogos(true);
    
    try {
      const logos = await generateLogos(selectedName, styleId, vibes);
      // Limit to 4 options for mobile-friendliness
      setGeneratedLogos(logos.slice(0, 4));
      setSelectedLogoIndex(null);
      setLikedLogos(new Set());
      setLogoSection('select');
      
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

  // Logo: Regenerate all logos
  const handleRegenerateLogos = async () => {
    if (!selectedLogoStyle) return;
    
    setIsGeneratingLogos(true);
    try {
      const logos = await generateLogos(selectedName, selectedLogoStyle, vibes);
      // Limit to 4 options for mobile-friendliness
      setGeneratedLogos(logos.slice(0, 4));
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

  // Logo: Reject and replace single logo
  const handleRejectLogo = async (index: number) => {
    setRegeneratingLogoIndex(index);
    
    try {
      const newLogos = await generateLogos(selectedName, selectedLogoStyle, vibes);
      
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

  // Logo: Toggle like
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

  // Logo: Confirm selection and complete
  const handleLogoConfirm = () => {
    if (selectedLogoIndex === null) return;
    
    toast({
      title: "💪 Your logo choice screams confidence!",
      description: "Your brand identity is ready to shine."
    });
    
    const finalLogo = generatedLogos[selectedLogoIndex];
    const selectedNameOption = nameOptions.find(opt => opt.name === selectedName);
    
    onNext({
      name: selectedName,
      nameOptions,
      tagline: selectedNameOption?.tagline || 'Helping you succeed',
      bio: generatedBio || aboutYou.expertise,
      colors: generatedColors.length > 0 ? generatedColors : [],
      logoUrl: finalLogo,
      logoSVG: finalLogo,
      logoSource: 'generated'
    });
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-fade-in">
      {/* Top Guidance Banner */}
      <div className="text-center space-y-3 pb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your brand is taking shape! ✨
          </span>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          This is where your business comes to life. Your name and logo are the first things people will see, so let's make them shine.
        </p>
      </div>

      {/* NAME SECTION - Hide when logo section is active to avoid vertical stacking */}
      {logoSection === 'hidden' && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Business Name</h3>
                <p className="text-sm text-muted-foreground">Choose or create your brand name</p>
              </div>
            </div>

          {/* Name: Initial choice */}
          {nameSection === 'choice' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Do you already have a business name?
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => handleHasNameChoice(true)}
                  variant="outline"
                  className="w-full h-auto py-4 text-left justify-start hover:border-primary hover:bg-primary/5"
                >
                  <div>
                    <div className="font-semibold mb-1">Yes, I have a name</div>
                    <div className="text-xs text-muted-foreground">We'll polish it and show you creative alternatives too.</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleHasNameChoice(false)}
                  variant="outline"
                  className="w-full h-auto py-4 text-left justify-start hover:border-primary hover:bg-primary/5"
                >
                  <div>
                    <div className="font-semibold mb-1">No, help me create one</div>
                    <div className="text-xs text-muted-foreground">Let's brainstorm magic names together in seconds.</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Name: Enter existing name */}
          {nameSection === 'existing' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="existingName">What's your business name?</Label>
                <Input
                  id="existingName"
                  value={existingName}
                  onChange={(e) => setExistingName(e.target.value)}
                  placeholder="Enter your business name"
                  className="text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  We'll also show you some alternative ideas — just in case!
                </p>
              </div>

              {existingName && (
                <p className="text-sm text-primary font-medium animate-fade-in">
                  Perfect — that's going to look great! ✨
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setNameSection('choice')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExistingNameSubmit}
                  disabled={!existingName.trim() || isGeneratingNames}
                  className="flex-1"
                >
                  {isGeneratingNames ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Name: Generating state */}
          {nameSection === 'generate' && isGeneratingNames && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Creating your name options...</span>
            </div>
          )}

          {/* Name: Selection */}
          {nameSection === 'select' && (
            <div className="space-y-4">
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-foreground">
                  Here are some names matched to your vibe & audience — any of these could become your brand. Like one, tweak one, or refresh for more.
                </p>
              </div>
              
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateNames}
                  disabled={isGeneratingNames}
                  className="text-xs shrink-0"
                >
                  {isGeneratingNames ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {/* Show existing name if entered */}
                {hasExistingName && existingName && (
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedName === existingName ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => setSelectedName(existingName)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{existingName}</span>
                          {selectedName === existingName && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Your original name</p>
                      </div>
                    </div>
                  </div>
                )}

                {nameOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">{option.name}</span>
                            {selectedName === option.name && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground italic mb-2">{option.tagline}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 transition-colors ${likedNames.has(option.name) ? 'text-green-600 bg-green-50 dark:bg-green-950' : 'text-muted-foreground hover:text-green-600'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLikeName(option.name);
                                }}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Love this</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectName(index);
                                }}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Not for me</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedName && (
                <p className="text-sm text-primary font-medium animate-fade-in text-center">
                  That's a strong brand name! ✨
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNameSection(hasExistingName ? 'existing' : 'choice');
                    setSelectedName('');
                  }}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNameConfirm}
                  disabled={!selectedName}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold"
                >
                  🔥 Love it — now let's design your logo →
                </Button>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      )}

      {/* LOGO SECTION - Only show when name is selected */}
      {logoSection !== 'hidden' && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-brand-orange-light flex items-center justify-center shadow-md">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Logo Design</h3>
                <p className="text-sm text-muted-foreground">for {selectedName}</p>
              </div>
            </div>

            {/* Logo: Initial choice */}
            {logoSection === 'choice' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Do you already have a logo?
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleHasLogoChoice(true)}
                    variant="outline"
                    className="w-full h-auto py-4 text-left justify-start hover:border-primary hover:bg-primary/5"
                  >
                    <Upload className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">Yes, I have a logo</div>
                      <div className="text-xs text-muted-foreground">Upload your existing logo file</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleHasLogoChoice(false)}
                    variant="outline"
                    className="w-full h-auto py-4 text-left justify-start hover:border-primary hover:bg-primary/5"
                  >
                    <Sparkles className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">No, help me create one</div>
                      <div className="text-xs text-muted-foreground">We'll generate beautiful options</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Logo: Upload */}
            {logoSection === 'upload' && (
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

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setLogoSection('choice')}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUploadedLogoSubmit}
                    disabled={!uploadedLogo}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Logo: Style selection */}
            {logoSection === 'generate' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Your logo is the face of your business. We've designed these to reflect your vibe & style — pick one you love (you can refine later).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {logoStyles.map((logo) => {
                    const Icon = logo.icon;
                    const isSelected = selectedLogoStyle === logo.id;
                    
                    return (
                      <Card
                        key={logo.id}
                        className={`cursor-pointer transition-all hover:scale-[1.02] ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${isGeneratingLogos ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={() => !isGeneratingLogos && setSelectedLogoStyle(logo.id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${logo.gradient}`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <h4 className="text-sm font-bold">{logo.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {logo.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedLogoStyle && !isGeneratingLogos && (
                  <p className="text-sm text-primary font-medium text-center animate-fade-in">
                    ✨ Great choice! This style will guide your logo designs
                  </p>
                )}

                {isGeneratingLogos && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Creating your logo options...</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setLogoSection('choice')}
                    disabled={isGeneratingLogos}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => selectedLogoStyle && handleLogoStyleSelect(selectedLogoStyle)}
                    disabled={!selectedLogoStyle || isGeneratingLogos}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    ✨ Generate my logos ✨
                  </Button>
                </div>
              </div>
            )}

            {/* Logo: Selection */}
            {logoSection === 'select' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    These logos are matched to your vibe & style. Pick one you love — you can always tweak later.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateLogos}
                    disabled={isGeneratingLogos}
                    className="text-xs shrink-0"
                  >
                    {isGeneratingLogos ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  {generatedLogos.map((logo, idx) => (
                    <Card
                      key={idx}
                      className={`border-2 transition-all hover:shadow-md ${
                        selectedLogoIndex === idx ? 'border-primary bg-primary/5' : 'border-border'
                      } ${regeneratingLogoIndex === idx ? 'opacity-50' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => setSelectedLogoIndex(idx)}
                        >
                          <div className="w-20 h-20 flex items-center justify-center bg-muted rounded-lg flex-shrink-0">
                            <img src={logo} alt={`${logoNicknames[idx]}`} className="max-w-full max-h-full object-contain p-2" />
                          </div>

                          <div className="flex-1">
                            <p className="font-medium">{logoNicknames[idx]}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedLogoIndex === idx ? 'Selected' : 'Tap to select'}
                            </p>
                          </div>

                          {selectedLogoIndex === idx && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={likedLogos.has(idx) ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLikeLogo(idx);
                                }}
                                className="flex-1 h-8 text-xs transition-colors"
                              >
                                <ThumbsUp className={`h-3 w-3 mr-1 ${likedLogos.has(idx) ? 'fill-current' : ''}`} />
                                <span className="hidden sm:inline">Like</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Love this</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <ThumbsDown className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Replace</span>
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Not for me</TooltipContent>
                          </Tooltip>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedLogoIndex !== null && (
                  <div className="space-y-3 pt-2 animate-fade-in">
                    <p className="text-sm text-primary font-medium text-center">
                      💡 Great pick — this logo will be the visual anchor of your brand.
                    </p>
                    <div className="text-center space-y-1 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                      <p className="text-sm font-semibold text-foreground">
                        Your logo choice screams confidence!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        With your name and logo chosen, SideHive will now transform this into your storefront and the social posts that attract your first customers.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setLogoSection('generate')}
                    disabled={isGeneratingLogos}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleLogoConfirm}
                    disabled={selectedLogoIndex === null}
                    className="flex-1 bg-gradient-to-r from-primary via-accent to-brand-orange hover:opacity-90 text-white font-bold shadow-lg"
                  >
                    🚀 Amazing! Reveal My Shopfront →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Navigation - Only show on name section */}
      {logoSection === 'hidden' && (
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onBack}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
};

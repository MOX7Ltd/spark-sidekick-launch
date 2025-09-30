import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Palette, Eye, Lightbulb, Sparkles, Zap, Target, Heart, Star, Hexagon, RefreshCw, Loader2 } from 'lucide-react';
import { CustomerStorefront } from './CustomerStorefront';
import { regenerateBusinessNames, generateLogos } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StepThreeExpandedNewProps {
  onNext: (businessIdentity: { 
    name: string; 
    logo: string; 
    tagline: string; 
    bio: string; 
    colors: string[]; 
    logoSVG: string; 
    nameOptions: string[] 
  }) => void;
  onBack: () => void;
  initialValue?: { 
    name: string; 
    logo: string; 
    tagline?: string; 
    bio?: string; 
    colors?: string[]; 
    logoSVG?: string; 
    nameOptions?: string[] 
  };
  idea: string;
  aboutYou: {
    firstName: string;
    lastName: string;
    expertise: string;
    style: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  };
  audience: string;
}

const logoStyles = [
  { id: 'modern', name: 'Modern Minimalist', gradient: 'from-slate-600 to-slate-800', icon: Lightbulb },
  { id: 'playful', name: 'Playful & Colorful', gradient: 'from-pink-500 to-orange-400', icon: Sparkles },
  { id: 'bold', name: 'Bold Typography', gradient: 'from-purple-600 to-indigo-600', icon: Zap },
  { id: 'professional', name: 'Clean Professional', gradient: 'from-blue-600 to-blue-800', icon: Target },
  { id: 'icon', name: 'Icon-Based', gradient: 'from-teal-500 to-cyan-600', icon: Heart },
  { id: 'retro', name: 'Retro/Vintage', gradient: 'from-amber-600 to-red-600', icon: Star },
  { id: 'gradient', name: 'Dynamic Gradient', gradient: 'from-violet-500 via-purple-500 to-pink-500', icon: Hexagon },
];

export const StepThreeExpandedNew = ({ onNext, onBack, initialValue, idea, aboutYou, audience }: StepThreeExpandedNewProps) => {
  const [selectedName, setSelectedName] = useState(initialValue?.name || '');
  const [customName, setCustomName] = useState('');
  const [nameOptions, setNameOptions] = useState(initialValue?.nameOptions || []);
  const [selectedLogoStyle, setSelectedLogoStyle] = useState(initialValue?.logo || 'modern');
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);
  const [selectedLogoIndex, setSelectedLogoIndex] = useState(0);
  const [isRegeneratingNames, setIsRegeneratingNames] = useState(false);
  const [isGeneratingLogos, setIsGeneratingLogos] = useState(false);
  const { toast } = useToast();

  const handleRegenerateNames = async () => {
    setIsRegeneratingNames(true);
    try {
      const newNames = await regenerateBusinessNames({
        idea,
        audience,
        experience: aboutYou.expertise,
        firstName: aboutYou.firstName,
        tone: aboutYou.style.toLowerCase() as 'professional' | 'friendly' | 'playful',
        namingPreference: (aboutYou.includeFirstName || aboutYou.includeLastName) ? 'with_personal_name' : 'anonymous'
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
      setIsRegeneratingNames(false);
    }
  };

  const handleGenerateLogos = async () => {
    const nameToUse = customName || selectedName || nameOptions[0];
    if (!nameToUse) {
      toast({
        title: "Please select a name first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingLogos(true);
    try {
      const logos = await generateLogos(nameToUse, selectedLogoStyle);
      setGeneratedLogos(logos);
      setSelectedLogoIndex(0);
      toast({
        title: "🎨 Logos generated!",
        description: "Select your favorite or generate again"
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

  const handleSubmit = () => {
    const finalName = customName || selectedName || nameOptions[0];
    const finalLogo = generatedLogos[selectedLogoIndex] || initialValue?.logoSVG || '';
    
    onNext({
      name: finalName,
      logo: selectedLogoStyle,
      tagline: initialValue?.tagline || 'Helping you succeed',
      bio: initialValue?.bio || 'Welcome to my business',
      colors: initialValue?.colors || ['#2563eb', '#1d4ed8'],
      logoSVG: finalLogo,
      nameOptions: nameOptions
    });
  };

  const displayName = customName || selectedName || nameOptions[0] || 'Your Business';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Palette className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold">Business Identity</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Customize your business name and logo
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr,1.3fr] gap-6">
        {/* Left side - Identity Selection */}
        <div className="space-y-5">
          {/* Business Name Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Business Name
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateNames}
                  disabled={isRegeneratingNames}
                  className="text-xs h-8"
                >
                  {isRegeneratingNames ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {nameOptions.map((name, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedName === name && !customName ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => {
                    setSelectedName(name);
                    setCustomName('');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base">{name}</span>
                    {selectedName === name && !customName && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Custom Name Input */}
              <div className="pt-2">
                <Label htmlFor="customName" className="text-sm text-muted-foreground mb-2">
                  Or enter your own:
                </Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter custom business name"
                  className="mt-1"
                />
              </div>

              {(selectedName || customName) && (
                <p className="text-sm text-primary font-medium animate-fade-in pt-1">
                  🔥 Perfect choice!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Logo Style Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-5 w-5 text-primary" />
                Logo Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {logoStyles.map((logo) => {
                  const Icon = logo.icon;
                  return (
                    <div
                      key={logo.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                        selectedLogoStyle === logo.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedLogoStyle(logo.id)}
                    >
                      <div
                        className={`w-full h-14 rounded-lg bg-gradient-to-br ${logo.gradient} flex items-center justify-center mb-2`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-xs font-medium text-center leading-tight">{logo.name}</p>
                    </div>
                  );
                })}
              </div>

              {/* Generate Logos Button */}
              <Button
                onClick={handleGenerateLogos}
                disabled={isGeneratingLogos || !selectedLogoStyle}
                className="w-full mt-4"
                variant="outline"
              >
                {isGeneratingLogos ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Logo Options
                  </>
                )}
              </Button>

              {/* Generated Logos Display */}
              {generatedLogos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm">Select your logo:</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {generatedLogos.map((logo, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                          selectedLogoIndex === idx ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => setSelectedLogoIndex(idx)}
                      >
                        <img src={logo} alt={`Logo ${idx + 1}`} className="w-full h-16 object-contain" />
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleGenerateLogos}
                    disabled={isGeneratingLogos}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Generate Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right side - Live Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-primary" />
                Live Storefront Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerStorefront
                idea={idea}
                aboutYou={aboutYou}
                audience={audience}
                businessIdentity={{
                  name: displayName,
                  logo: selectedLogoStyle,
                  tagline: initialValue?.tagline,
                  bio: initialValue?.bio,
                  colors: initialValue?.colors,
                  logoSVG: generatedLogos[selectedLogoIndex] || initialValue?.logoSVG
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button onClick={onBack} variant="outline" className="px-8 h-12">
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="px-8 h-12 text-base" 
          disabled={!displayName}
        >
          🎉 See Your Business
        </Button>
      </div>
    </div>
  );
};

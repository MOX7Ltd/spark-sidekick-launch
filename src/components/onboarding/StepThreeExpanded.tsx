import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Palette, Eye, Lightbulb, Sparkles, Zap, Target, Heart, Star, Hexagon } from 'lucide-react';
import { LivePreview } from './LivePreview';

interface StepThreeExpandedProps {
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
    expertise: string;
    style: string;
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

export const StepThreeExpanded = ({ onNext, onBack, initialValue, idea, aboutYou, audience }: StepThreeExpandedProps) => {
  const [selectedName, setSelectedName] = useState(initialValue?.name || '');
  const [selectedLogo, setSelectedLogo] = useState(initialValue?.logo || 'modern');

  const handleSubmit = () => {
    onNext({
      name: selectedName || initialValue?.nameOptions?.[0] || 'My Business',
      logo: selectedLogo,
      tagline: initialValue?.tagline || 'Helping you succeed',
      bio: initialValue?.bio || 'Welcome to my business',
      colors: initialValue?.colors || ['#2563eb', '#1d4ed8'],
      logoSVG: initialValue?.logoSVG || '',
      nameOptions: initialValue?.nameOptions || []
    });
  };

  const nameOptions = initialValue?.nameOptions || [];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Palette className="h-7 w-7 text-primary" />
          <h2 className="text-3xl font-bold">Business Identity</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Select your business name and logo style
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr,1.2fr] gap-6">
        {/* Left side - Identity Selection */}
        <div className="space-y-5">
          {/* Business Name Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-primary" />
                Business Name
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nameOptions.map((name, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedName === name ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setSelectedName(name)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base">{name}</span>
                    {selectedName === name && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {selectedName && (
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
                        selectedLogo === logo.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedLogo(logo.id)}
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
            </CardContent>
          </Card>
        </div>

        {/* Right side - Live Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-primary" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LivePreview
                idea={idea}
                aboutYou={aboutYou}
                audience={audience}
                businessIdentity={{
                  name: selectedName || nameOptions[0],
                  logo: selectedLogo,
                  tagline: initialValue?.tagline,
                  bio: initialValue?.bio,
                  colors: initialValue?.colors,
                  logoSVG: initialValue?.logoSVG,
                  nameOptions: initialValue?.nameOptions
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
        <Button onClick={handleSubmit} className="px-8 h-12 text-base" disabled={!selectedName}>
          🎉 See Your Business
        </Button>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, Heart, Zap, Lightbulb, Target, TrendingUp, BookOpen, Sparkles } from 'lucide-react';

interface StepAboutYouProps {
  onNext: (data: { 
    firstName: string; 
    lastName: string;
    expertise: string;
    motivation: string;
    styles: string[];
    profilePicture?: string;
    includeFirstName: boolean;
    includeLastName: boolean;
  }) => void;
  onBack: () => void;
  initialValue?: { 
    firstName?: string; 
    lastName?: string;
    expertise?: string;
    motivation?: string;
    styles?: string[];
    profilePicture?: string;
    includeFirstName?: boolean;
    includeLastName?: boolean;
  };
  isLoading?: boolean;
}

const styleOptions = [
  { value: 'Professional', label: 'Professional', icon: Target, description: 'Clear, authoritative, business-focused' },
  { value: 'Friendly', label: 'Friendly', icon: Heart, description: 'Warm, approachable, conversational' },
  { value: 'Playful', label: 'Playful', icon: Sparkles, description: 'Fun, energetic, lighthearted' },
  { value: 'Inspirational', label: 'Inspirational', icon: TrendingUp, description: 'Motivational, visionary, uplifting' },
  { value: 'Bold', label: 'Bold & Direct', icon: Zap, description: 'High-energy, confident, action-driven' },
  { value: 'Educational', label: 'Educational', icon: BookOpen, description: 'Informative, teaching-oriented, helpful' },
];

export const StepAboutYou = ({ onNext, onBack, initialValue, isLoading }: StepAboutYouProps) => {
  const [firstName, setFirstName] = useState(initialValue?.firstName || '');
  const [lastName, setLastName] = useState(initialValue?.lastName || '');
  const [expertise, setExpertise] = useState(initialValue?.expertise || '');
  const [motivation, setMotivation] = useState(initialValue?.motivation || '');
  const [styles, setStyles] = useState<string[]>(initialValue?.styles || []);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(initialValue?.profilePicture);
  const [includeFirstName, setIncludeFirstName] = useState(initialValue?.includeFirstName ?? false);
  const [includeLastName, setIncludeLastName] = useState(initialValue?.includeLastName ?? false);
  const [isListening, setIsListening] = useState(false);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceInput = (field: 'expertise' | 'motivation') => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'expertise') {
        setExpertise(prev => prev ? `${prev} ${transcript}` : transcript);
      } else {
        setMotivation(prev => prev ? `${prev} ${transcript}` : transcript);
      }
    };

    recognition.start();
  };

  const toggleStyle = (value: string) => {
    setStyles(prev => 
      prev.includes(value) 
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ firstName, lastName, expertise, motivation, styles, profilePicture, includeFirstName, includeLastName });
  };

  const isValid = expertise.length >= 10 && styles.length > 0;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <User className="w-7 h-7 text-primary" />
          <h2 className="text-3xl font-bold">About You</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Let's make it personal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base font-medium">
              First Name (optional)
            </Label>
            <div className="space-y-2">
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="h-11 text-base"
              />
              {firstName && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeFirstName"
                    checked={includeFirstName}
                    onChange={(e) => setIncludeFirstName(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <Label htmlFor="includeFirstName" className="text-sm font-normal cursor-pointer">
                    Include this in my business name
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base font-medium">
              Last Name (optional)
            </Label>
            <div className="space-y-2">
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="h-11 text-base"
              />
              {lastName && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeLastName"
                    checked={includeLastName}
                    onChange={(e) => setIncludeLastName(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <Label htmlFor="includeLastName" className="text-sm font-normal cursor-pointer">
                    Include this in my business name
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profilePicture" className="text-base font-medium">
              Profile Picture (optional)
            </Label>
            <div className="flex items-center gap-4">
              {profilePicture && (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise" className="text-base font-medium">
              Tell us a little about your experience or skills
            </Label>
            <div className="relative">
              <Textarea
                id="expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="1-2 sentences about what you do or what you're good at"
                className="min-h-[90px] text-base resize-none pr-12"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => startVoiceInput('expertise')}
                disabled={isListening}
              >
                {isListening ? '🎤 Listening...' : '🎤'}
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                💡 Examples:
              </p>
              <p className="text-xs text-muted-foreground pl-4">
                • "I've been helping friends set up websites for years."
              </p>
              <p className="text-xs text-muted-foreground pl-4">
                • "I love crafts and want to turn that into income."
              </p>
            </div>
            {expertise.length >= 10 && (
              <p className="text-sm text-primary font-medium animate-fade-in">
                ✨ Perfect, this will help make your business unique!
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation" className="text-base font-medium">
              Why do you want to start this business? <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <div className="relative">
              <Textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Share your 'why' if you'd like..."
                className="min-h-[90px] text-base resize-none pr-12"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => startVoiceInput('motivation')}
                disabled={isListening}
              >
                {isListening ? '🎤 Listening...' : '🎤'}
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                💡 Examples:
              </p>
              <p className="text-xs text-muted-foreground pl-4">
                • "I've always dreamed of turning my passion into income."
              </p>
              <p className="text-xs text-muted-foreground pl-4">
                • "I need more freedom and flexibility in life."
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">
              Tone & Style <span className="text-muted-foreground text-sm font-normal">(Select all that apply)</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {styleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = styles.includes(option.value);
                return (
                  <Card 
                    key={option.value}
                    className={`cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleStyle(option.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1 space-y-1">
                          <div className="font-semibold text-sm">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {styles.length > 0 && expertise.length >= 10 && (
              <p className="text-sm text-primary font-medium animate-fade-in">
                🔥 Great choices! We're getting to know you
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button 
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1 h-12 text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button 
            type="submit"
            size="lg"
            disabled={!isValid || isLoading}
            className="flex-1 h-12 text-base"
          >
            {isLoading ? 'Generating...' : 'Next step →'}
          </Button>
        </div>
      </form>
    </div>
  );
};
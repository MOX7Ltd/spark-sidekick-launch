import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check, Sparkles, Mic } from 'lucide-react';

interface StepAboutYouMobileProps {
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
  { value: 'Professional', label: 'Professional', emoji: '🎯' },
  { value: 'Friendly', label: 'Friendly', emoji: '💬' },
  { value: 'Playful', label: 'Playful', emoji: '✨' },
  { value: 'Inspirational', label: 'Inspirational', emoji: '💡' },
  { value: 'Bold', label: 'Bold & Direct', emoji: '⚡' },
  { value: 'Educational', label: 'Educational', emoji: '🎓' },
];

export const StepAboutYouMobile = ({ onNext, onBack, initialValue, isLoading }: StepAboutYouMobileProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [firstName, setFirstName] = useState(initialValue?.firstName || '');
  const [expertise, setExpertise] = useState(initialValue?.expertise || '');
  const [motivation, setMotivation] = useState(initialValue?.motivation || '');
  const [styles, setStyles] = useState<string[]>(initialValue?.styles || []);
  const [isListening, setIsListening] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const totalQuestions = 3;

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

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentQuestion(currentQuestion + 1);
      }, 800);
    } else if (currentQuestion === totalQuestions) {
      onNext({ 
        firstName, 
        lastName: '', 
        expertise, 
        motivation, 
        styles, 
        includeFirstName: false, 
        includeLastName: false 
      });
    }
  };

  const handleSkip = () => {
    if (currentQuestion === 2) {
      setMotivation('');
    }
    handleNext();
  };

  const canProceed = () => {
    if (currentQuestion === 1) return firstName.length > 0;
    if (currentQuestion === 2) return expertise.length >= 10;
    if (currentQuestion === 3) return styles.length > 0;
    return false;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {[...Array(totalQuestions)].map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i + 1 === currentQuestion 
                ? 'w-8 bg-primary' 
                : i + 1 < currentQuestion 
                ? 'w-2 bg-primary' 
                : 'w-2 bg-border'
            }`}
          />
        ))}
      </div>

      {/* Question 1: Name */}
      {currentQuestion === 1 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">What should we call you?</h2>
              <p className="text-muted-foreground">
                Just your first name is perfect 😊
              </p>
            </div>

            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name..."
              className="h-14 text-lg"
              autoFocus
            />

            {firstName.length > 0 && (
              <div className="flex items-center gap-2 text-primary animate-bounce-in">
                <Check className="w-5 h-5" />
                <span className="font-medium">Nice one! ✨</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline"
                size="lg"
                onClick={onBack}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-12"
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 2: Expertise */}
      {currentQuestion === 2 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">What's something you're great at or love doing?</h2>
              <p className="text-muted-foreground">
                This helps us make your business unique to you
              </p>
            </div>

            <div className="relative">
              <Textarea
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="I'm really good at..."
                className="min-h-[120px] text-base resize-none pr-12"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => startVoiceInput('expertise')}
                disabled={isListening}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
              </Button>
            </div>

            {expertise.length >= 10 && (
              <div className="flex items-center gap-2 text-primary animate-bounce-in">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Perfect! This will help us personalize your business ✨</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Examples:</p>
              <p className="pl-4">• "I've been designing websites for friends for years"</p>
              <p className="pl-4">• "I love crafts and want to turn that into income"</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setCurrentQuestion(1)}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-12"
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 3: Tone & Style */}
      {currentQuestion === 3 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">What vibe feels right to you?</h2>
              <p className="text-muted-foreground">
                Pick all that match your style (tap as many as you like)
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {styleOptions.map((option) => {
                const isSelected = styles.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleStyle(option.value)}
                    className={`px-5 py-3 rounded-full text-base font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground scale-105 shadow-lg' 
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    <span className="mr-2">{option.emoji}</span>
                    {option.label}
                    {isSelected && <Check className="inline-block ml-2 w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            {styles.length > 0 && (
              <div className="flex items-center gap-2 text-primary animate-bounce-in">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Great choices! We're getting to know you 🔥</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setCurrentQuestion(2)}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                size="lg"
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="flex-1 h-12"
              >
                {isLoading ? 'Generating...' : 'Continue →'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success animation */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full shadow-2xl animate-bounce-in">
            <Check className="w-8 h-8" />
          </div>
        </div>
      )}
    </div>
  );
};
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

const vibeStyleOptions = [
  { value: 'Professional', label: 'Professional', emoji: '🎯', description: 'Clear, credible, and trustworthy' },
  { value: 'Playful', label: 'Playful', emoji: '✨', description: 'Fun, approachable, and energetic' },
  { value: 'Bold', label: 'Bold', emoji: '⚡', description: 'Confident and attention-grabbing' },
  { value: 'Visionary', label: 'Visionary', emoji: '🚀', description: 'Future-focused and innovative' },
  { value: 'Friendly', label: 'Friendly', emoji: '💬', description: 'Warm and approachable' },
  { value: 'Educational', label: 'Educational', emoji: '🎓', description: 'Informative and helpful' },
  { value: 'Inspirational', label: 'Inspirational', emoji: '💡', description: 'Motivating and uplifting' },
];

export const StepAboutYouMobile = ({ onNext, onBack, initialValue, isLoading }: StepAboutYouMobileProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [firstName, setFirstName] = useState(initialValue?.firstName || '');
  const [lastName, setLastName] = useState(initialValue?.lastName || '');
  const [expertise, setExpertise] = useState(initialValue?.expertise || '');
  const [motivation, setMotivation] = useState(initialValue?.motivation || '');
  const [styles, setStyles] = useState<string[]>(initialValue?.styles || []);
  const [includeFirstName, setIncludeFirstName] = useState(initialValue?.includeFirstName || false);
  const [includeLastName, setIncludeLastName] = useState(initialValue?.includeLastName || false);
  const [isListening, setIsListening] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const totalQuestions = 4;

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
        lastName, 
        expertise, 
        motivation, 
        styles,
        includeFirstName, 
        includeLastName 
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
    if (currentQuestion === 2) return true; // Why is optional/skippable
    if (currentQuestion === 3) return expertise.length >= 10;
    if (currentQuestion === 4) return styles.length > 0;
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

      {/* Question 1: Name (Combined First & Last) */}
      {currentQuestion === 1 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">What's your name?</h2>
              <p className="text-muted-foreground">
                We'll use it to personalize your business
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name *"
                  className="h-14 text-lg"
                  autoFocus
                />
              </div>
              
              <div>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name (optional)"
                  className="h-14 text-lg"
                />
              </div>
            </div>

            {firstName.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-primary animate-bounce-in">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Amazing — your idea is already taking shape ✨</span>
                </div>
                
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Include in business name:</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFirstName}
                      onChange={(e) => setIncludeFirstName(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm">First name ({firstName})</span>
                  </label>
                  {lastName && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLastName}
                        onChange={(e) => setIncludeLastName(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm">Last name ({lastName})</span>
                    </label>
                  )}
                </div>
              </>
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

      {/* Question 2: Your Why (Optional) */}
      {currentQuestion === 2 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Why do you want to start this business?</h2>
              <p className="text-muted-foreground">
                What's driving you to make this happen?
              </p>
            </div>

            <div className="relative">
              <Textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="I want to..."
                className="min-h-[120px] text-base resize-none pr-12"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => startVoiceInput('motivation')}
                disabled={isListening}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
              </Button>
            </div>

            {motivation.length >= 10 && (
              <div className="flex items-center gap-2 text-primary animate-bounce-in">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Your why is powerful! This will connect with people 🔥</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Examples:</p>
              <p className="pl-4">• "I want more freedom and flexibility in my life"</p>
              <p className="pl-4">• "I want to help others like me who are struggling"</p>
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
                variant="ghost"
                size="lg"
                onClick={handleSkip}
                className="flex-1 h-12"
              >
                Skip
              </Button>
              <Button 
                size="lg"
                onClick={handleNext}
                disabled={motivation.length === 0}
                className="flex-1 h-12"
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 3: Your Story */}
      {currentQuestion === 3 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">What makes you ready to start this business?</h2>
              <p className="text-muted-foreground">
                This is where your experience, passion, or personal story shines through
              </p>
            </div>

            <div className="relative">
              <Textarea
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="Share your story..."
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
                <span className="font-medium">Amazing! Your story is what makes this special ✨</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Examples:</p>
              <p className="pl-4">• "I've raised 5 kids and know the chaos of family life"</p>
              <p className="pl-4">• "I love running and have coached beginners for years"</p>
            </div>

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
                disabled={!canProceed()}
                className="flex-1 h-12"
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 4: Vibe & Style (Consolidated Multi-Select) */}
      {currentQuestion === 4 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">What vibe & style do you want?</h2>
              <p className="text-muted-foreground">
                This shapes your name, logo, posts, and how you show up. Pick as many as you like!
              </p>
            </div>

            <div className="space-y-2">
              {vibeStyleOptions.map((option) => {
                const isSelected = styles.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleStyle(option.value)}
                    className={`w-full p-4 rounded-lg text-left transition-all border-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {styles.length > 0 && (
              <div className="flex items-center gap-2 text-primary animate-bounce-in">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">
                  {styles.length === 1 
                    ? 'Perfect — your vibe is coming through! ✨' 
                    : 'This is looking fantastic — let\'s add the finishing touches 🚀'}
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setCurrentQuestion(3)}
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
                {isLoading ? 'Generating...' : 'Perfect — now who\'s this for? →'}
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
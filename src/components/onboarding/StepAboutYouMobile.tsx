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
  const [includeFirstName, setIncludeFirstName] = useState(initialValue?.includeFirstName || false);
  const [includeLastName, setIncludeLastName] = useState(initialValue?.includeLastName || false);
  const [isListening, setIsListening] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const allMotivationExamples = [
    "I want kids to fall in love with soccer like I did",
    "I want to help parents feel less overwhelmed and more confident",
    "I want to show people they don't need a degree to build a creative career",
    "I want busy professionals to discover they can cook healthy meals in 15 minutes",
    "I want to help people build financial freedom without feeling confused"
  ];
  
  const allExpertiseExamples = [
    "I've coached youth soccer teams every weekend for 3 years",
    "I've been teaching guitar to friends for years and they keep asking for more lessons",
    "I've helped 20+ friends plan their dream vacations",
    "I've managed social media for small businesses and always get results",
    "I've raised 3 kids and learned every parenting hack in the book"
  ];

  // Randomly select 2 examples on component mount
  const [motivationExamples] = useState(() => {
    const shuffled = [...allMotivationExamples].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  });
  
  const [expertiseExamples] = useState(() => {
    const shuffled = [...allExpertiseExamples].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  });

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
    return false;
  };

  return (
    <div className="w-full max-w-screen-sm mx-auto px-3 sm:px-4 py-6 animate-fade-in">
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
        <Card className="border-2 border-primary/20 animate-fade-in-up max-w-full">
          <CardContent className="p-4 sm:p-6 space-y-6 max-w-full">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold break-words">What's your name?</h2>
              <p className="text-muted-foreground">
                Your name gives your business a personal touch — it's how people connect with you
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name *"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                  autoFocus
                />
              </div>
              
              <div>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name (optional)"
                  className="h-12 sm:h-14 text-base sm:text-lg"
                />
              </div>
            </div>

            {firstName.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-primary animate-bounce-in">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="font-medium text-sm sm:text-base break-words">🙌 Amazing — your idea now has your signature on it!</span>
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

            <div className="flex gap-2 sm:gap-3 pt-4">
              <Button 
                variant="secondary"
                size="lg"
                onClick={onBack}
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base whitespace-nowrap"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Button 
                variant="hero"
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base whitespace-nowrap"
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 2: Your Why (Optional) */}
      {currentQuestion === 2 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up max-w-full">
          <CardContent className="p-4 sm:p-6 space-y-6 max-w-full">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold break-words">Why do you want to start this business?</h2>
              <p className="text-muted-foreground">
                Your "why" is what makes people care — it's the heart of your brand
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
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="font-medium text-sm sm:text-base break-words">🔥 Your why is powerful — people will connect with this instantly!</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Examples:</p>
              {motivationExamples.map((example, index) => (
                <p key={index} className="pl-4">• "{example}"</p>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => setCurrentQuestion(1)}
                className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base whitespace-nowrap"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button 
                variant="hero"
                size="lg"
                onClick={handleNext}
                disabled={motivation.length === 0}
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base whitespace-nowrap"
              >
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 3: Your Story */}
      {currentQuestion === 3 && (
        <Card className="border-2 border-primary/20 animate-fade-in-up max-w-full">
          <CardContent className="p-4 sm:p-6 space-y-6 max-w-full">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold break-words">What makes you ready to start this business?</h2>
              <p className="text-muted-foreground">
                Your experience, skills, or story — this is your unfair advantage
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
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="font-medium text-sm sm:text-base break-words">💪 This is your unfair advantage — people will trust you!</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Examples:</p>
              {expertiseExamples.map((example, index) => (
                <p key={index} className="pl-4">• "{example}"</p>
              ))}
            </div>

            <div className="flex gap-2 sm:gap-3 pt-4">
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => setCurrentQuestion(2)}
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base whitespace-nowrap"
              >
                <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Button 
                variant="hero"
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
              >
                Beautiful — let's shape your business personality →
              </Button>
            </div>
            {canProceed() && (
              <p className="text-xs text-muted-foreground text-center animate-fade-in px-2">
                Your passion and story are the heart of your business. Now let's shape its personality and audience so it feels alive.
              </p>
            )}
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
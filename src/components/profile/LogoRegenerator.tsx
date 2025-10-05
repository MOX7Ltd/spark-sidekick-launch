import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { generateLogos } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface LogoRegeneratorProps {
  businessName: string;
  currentLogo?: string;
  onLogoSelected: (logoSvg: string) => void;
}

const LOGO_STYLES = [
  { id: 'icon-based', label: 'Icon-Based', description: 'Symbol-driven with optional text' },
  { id: 'typography-first', label: 'Typography', description: 'Text-focused wordmark' },
  { id: 'minimalist', label: 'Minimalist', description: 'Clean and simple' },
  { id: 'playful', label: 'Playful', description: 'Fun and energetic' },
  { id: 'modern-gradient', label: 'Modern Gradient', description: 'Vibrant color blends' },
  { id: 'bold', label: 'Bold', description: 'Strong and impactful' },
  { id: 'retro', label: 'Retro', description: 'Vintage aesthetic' },
  { id: 'handdrawn', label: 'Hand-Drawn', description: 'Organic and personal' },
];

export const LogoRegenerator = ({
  businessName,
  currentLogo,
  onLogoSelected
}: LogoRegeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('icon-based');
  const [logos, setLogos] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generatedLogos = await generateLogos(businessName, selectedStyle, []);
      setLogos(generatedLogos);
    } catch (error) {
      console.error('Error generating logos:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate logos. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectLogo = (logo: string) => {
    onLogoSelected(logo);
    setIsOpen(false);
    setLogos([]);
    toast({
      title: "Logo updated",
      description: "Your new logo has been applied.",
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Regenerate Logo
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Regenerate Logo with AI
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Style selector */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Select Style</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {LOGO_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${
                      selectedStyle === style.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {style.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            {logos.length === 0 && (
              <Button
                variant="hero"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate 4 Logos
                  </>
                )}
              </Button>
            )}

            {/* Logo grid */}
            {logos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Select a logo</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh Batch
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {logos.map((logo, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLogo(logo)}
                      className="group relative aspect-square border-2 rounded-lg hover:border-primary transition-colors overflow-hidden bg-white p-4"
                    >
                      <div
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: logo }}
                      />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

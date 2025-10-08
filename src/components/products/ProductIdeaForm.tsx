import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BeakerLoader } from '@/components/fx/BeakerLoader';
import { PRODUCT_FAMILIES, PRICE_BANDS } from '@/lib/productLab';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductIdeaFormProps {
  onGenerate: (data: any) => void;
  isGenerating: boolean;
}

export function ProductIdeaForm({ onGenerate, isGenerating }: ProductIdeaFormProps) {
  const [idea, setIdea] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [revenueEstimate, setRevenueEstimate] = useState<string>('');

  useEffect(() => {
    // Listen for regenerate event
    const handler = () => handleSubmit();
    window.addEventListener('regenerate-concepts', handler);
    return () => window.removeEventListener('regenerate-concepts', handler);
  }, [idea, selectedFamily]);

  useEffect(() => {
    if (selectedFamily && PRICE_BANDS[selectedFamily as keyof typeof PRICE_BANDS]) {
      const { low, high } = PRICE_BANDS[selectedFamily as keyof typeof PRICE_BANDS];
      const mid = Math.round((low + high) / 2);
      const perWeek = 5; // Conservative estimate
      const monthly = mid * perWeek * 4;
      setRevenueEstimate(`Price £${mid} • Sell ${perWeek}/week → ~£${monthly}/mo`);
    }
  }, [selectedFamily]);

  const handleSubmit = () => {
    if (!idea.trim() || !selectedFamily) return;

    onGenerate({
      idea: idea.trim(),
      family: selectedFamily,
      audienceHints: [],
      business_context: {}
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-white/75 border border-white/30 rounded-2xl p-4 shadow-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            What product do you have in mind?
          </label>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="6-week striker skills plan for U12s"
            className="min-h-[80px] resize-none"
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Product family
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCT_FAMILIES.map((family, index) => (
              <motion.button
                key={family.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedFamily(family.key)}
                disabled={isGenerating}
                className={`
                  p-3 rounded-lg text-left transition-all min-h-[44px]
                  ${selectedFamily === family.key
                    ? 'bg-gradient-to-br from-[hsl(var(--sh-teal-500))] to-[hsl(var(--sh-orange-500))] text-white shadow-md'
                    : 'bg-white/50 border border-white/30 text-foreground hover:bg-white/70'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70
                `}
                title={family.tooltip}
              >
                <div className="text-xs font-semibold">{family.label}</div>
                <div className={`text-xs mt-0.5 ${selectedFamily === family.key ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {family.priceRange}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {revenueEstimate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground bg-white/40 rounded-lg p-2 text-center"
          >
            💰 {revenueEstimate}
          </motion.div>
        )}

        {isGenerating ? (
          <BeakerLoader />
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!idea.trim() || !selectedFamily}
            className="w-full min-h-[48px] bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:brightness-105 shadow-lg hover:shadow-xl transition-all focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate concepts
          </Button>
        )}

        <p className="text-xs text-muted-foreground/70 text-center">
          Small experiments lead to big wins.
        </p>
      </div>
    </motion.div>
  );
}

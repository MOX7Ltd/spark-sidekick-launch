import { useState, useEffect } from 'react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { SubHeader } from '@/components/hub/SubHeader';
import { ProductIdeaForm } from '@/components/products/ProductIdeaForm';
import { ProductConceptCard } from '@/components/products/ProductConceptCard';
import { LabAura } from '@/components/fx/LabAura';
import { Button } from '@/components/ui/button';
import { FlaskConical, RefreshCw, Plus } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { motion } from 'framer-motion';

export default function ProductsLab() {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'view_product_lab',
      payload: {}
    });
  }, []);

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true);
    setConcepts([]);
    
    try {
      logFrontendEvent({
        eventType: 'user_action',
        step: 'generate_product_concepts',
        payload: { family: formData.family, has_audience_hints: !!formData.audienceHints }
      });

      // Call edge function
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('generate-product-concepts', {
        body: formData
      });

      if (error) throw error;
      setConcepts(data.concepts || []);
    } catch (error) {
      console.error('Failed to generate concepts:', error);
      logFrontendEvent({
        eventType: 'error',
        step: 'generate_product_concepts',
        payload: { error: String(error) }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    // Trigger form submission again
    window.dispatchEvent(new CustomEvent('regenerate-concepts'));
  };

  const handleNewIdea = () => {
    setConcepts([]);
  };

  return (
    <AppSurface className="relative">
      <LabAura />
      <div className="relative z-10">
        <BackBar to="/hub/products" label="Back to Products" />
        <SubHeader
          icon={<FlaskConical className="h-5 w-5" />}
          title="Product Lab"
          subtitle="Mix an idea, we'll turn it into offers."
        />

        <div className="space-y-4">
          <ProductIdeaForm onGenerate={handleGenerate} isGenerating={isGenerating} />

          {concepts.length === 0 && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 text-center"
            >
              <p className="text-muted-foreground text-sm">
                Drop one product idea in the flask. We'll do the alchemy.
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Small experiments lead to big wins.
              </p>
            </motion.div>
          )}

          {concepts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {concepts.map((concept, index) => (
                <ProductConceptCard
                  key={index}
                  concept={concept}
                  index={index}
                  onRemove={() => {
                    setConcepts(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              ))}
              <p className="mt-4 text-xs text-muted-foreground/70 text-center px-1">
                <span className="font-medium text-[hsl(var(--sh-teal-600))]">Tip:</span> Start premium; discount later. Value &gt; volume.
              </p>
            </motion.div>
          )}
        </div>

        {concepts.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-white/20 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20">
            <div className="mx-auto max-w-screen-sm flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleRegenerate}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button
                onClick={handleNewIdea}
                className="flex-1 bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:brightness-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                New idea
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppSurface>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Plus, ThumbsDown, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { revenueScenarios } from '@/lib/productLab';
import { normalizeFamily } from '@/lib/productCatalog';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ProductConceptCardProps {
  concept: any;
  index: number;
  onRemove: () => void;
}

export function ProductConceptCard({ concept, index, onRemove }: ProductConceptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const scenarios = revenueScenarios(concept.price_rec_low, concept.price_rec_high);

  const handleAdd = async () => {
    setIsAdding(true);
    
    try {
      logFrontendEvent({
        eventType: 'user_action',
        step: 'select_product_concept',
        payload: { family: concept.format }
      });

      // Create draft product
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save products.",
          variant: "destructive"
        });
        return;
      }

      // Normalize family before saving
      const normalizedFamily = normalizeFamily(concept.format ?? concept.family ?? concept.category);

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title: concept.title,
          description: concept.summary,
          status: 'draft',
          is_draft: true,
          type: normalizedFamily,  // canonical family
          format: concept.format,
          price: Math.round((concept.price_rec_low + concept.price_rec_high) / 2),
          fulfillment: {
            source: 'lab',
            deliverables: concept.deliverables,
            effort_estimate: concept.effort_estimate,
            price_model: concept.price_model,
            price_rec_low: concept.price_rec_low,
            price_rec_high: concept.price_rec_high,
            upsells: concept.upsells,
            cross_sells: concept.cross_sells,
            risks: concept.risks,
            raw_lab_format: concept.format ?? concept.family
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Sparkle effect and navigate
      toast({
        title: "✨ Draft bottled!",
        description: "Let's get it ready to sell.",
      });

      setTimeout(() => {
        navigate(`/hub/products/manage?new=${data.id}`);
      }, 300);

    } catch (error) {
      console.error('Failed to add product:', error);
      toast({
        title: "Failed to save",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleReject = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'reject_product_idea',
      payload: {}
    });
    onRemove();
  };

  const handleMoreLikeThis = () => {
    logFrontendEvent({
      eventType: 'user_action',
      step: 'more_like_this',
      payload: { from_title: concept.title }
    });
    // TODO: Implement variant generation
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="backdrop-blur-md bg-white/75 border-white/30 shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base text-foreground">{concept.title}</h3>
                <span className="inline-block mt-1 bg-gradient-to-br from-[hsl(var(--sh-teal-500))] to-[hsl(var(--sh-orange-500))] text-white text-xs px-2 py-0.5 rounded-full">
                  {concept.format}
                </span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground leading-tight">{concept.summary}</p>

            {/* Pricing & Effort */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-white/50 border border-white/30 rounded-full px-2 py-1">
                £{concept.price_rec_low}–£{concept.price_rec_high} • {concept.price_model}
              </span>
              <span className={`text-xs rounded-full px-2 py-1 ${
                concept.effort_estimate === 'low' ? 'bg-green-100 text-green-700' :
                concept.effort_estimate === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {concept.effort_estimate} effort
              </span>
            </div>

            {/* Revenue scenarios */}
            <div className="text-xs text-muted-foreground bg-white/40 rounded-lg p-2">
              <div className="flex justify-between">
                {scenarios.map((s, i) => (
                  <span key={i}>{s.units} units → £{s.revenue}</span>
                ))}
              </div>
            </div>

            {/* Deliverables (collapsible) */}
            {concept.deliverables && concept.deliverables.length > 0 && (
              <div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-[hsl(var(--sh-teal-600))] transition-colors"
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Deliverables ({concept.deliverables.length})
                </button>
                {expanded && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 space-y-1 text-xs text-muted-foreground pl-4"
                  >
                    {concept.deliverables.map((item: string, i: number) => (
                      <li key={i} className="list-disc">{item}</li>
                    ))}
                  </motion.ul>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleAdd}
                disabled={isAdding}
                className="w-full min-h-[44px] bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:brightness-105 shadow-md"
              >
                {isAdding ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to My Products
                  </>
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                  className="flex-1 min-h-[40px]"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Pass
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMoreLikeThis}
                  className="flex-1 min-h-[40px]"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  More like this
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

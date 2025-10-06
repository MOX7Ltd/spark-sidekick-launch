import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Loader2, RefreshCw, Bookmark, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { MicroGuidance } from '@/components/hub/MicroGuidance';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { IdeaCard } from '@/types/product';

export default function IdeaLab() {
  const [input, setInput] = useState('');
  const [ideas, setIdeas] = useState<IdeaCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!input.trim() || input.length < 10) {
      toast({
        title: 'More details needed',
        description: 'Please describe your niche, goal, or what you want to sell in more detail.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get brand context
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      // Sanitize brand_context before sending
      const toHexArray = (v: any) =>
        Array.isArray(v) 
          ? v.filter((x: any) => typeof x === 'string')
          : v && typeof v === 'object' 
            ? Object.values(v).filter((x: any) => typeof x === 'string')
            : undefined;

      const brand_context = business ? {
        business_name: business.business_name || undefined,
        tagline: business.tagline || undefined,
        bio: business.bio || undefined,
        brand_colors: toHexArray(business.brand_colors),
        audience: (typeof business.audience === 'string' && business.audience.trim()) || undefined,
        tone_tags: Array.isArray(business.tone_tags) ? business.tone_tags : undefined
      } : undefined;

      console.log('[IdeaLab] business.id:', business?.id, 'brand_context:', brand_context);

      // Call generate-ideas edge function
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: {
          input_text: input.trim(),
          max_ideas: 4,
          brand_context
        },
        headers: {
          'X-Session-Id': sessionId,
          'X-Trace-Id': `idea_${Date.now()}`
        }
      });

      if (error) throw error;
      if (!data?.ideas) throw new Error('No ideas returned');

      setIdeas(data.ideas);

      // Save to database (softly - don't block UI on errors)
      try {
        const { error: saveError } = await supabase.from('ideas').insert({
          owner_id: user.id,
          input_text: input.trim(),
          ideas_json: data.ideas
        });
        if (saveError) {
          console.warn('[IdeaLab] ideas insert failed:', saveError);
        }
      } catch (e) {
        console.warn('[IdeaLab] ideas persistence skipped:', e);
      }

      toast({
        title: 'Ideas generated!',
        description: `${data.ideas.length} product ideas ready for you.`
      });

    } catch (error: any) {
      console.error('Error generating ideas:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Could not generate ideas. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseIdea = async (idea: IdeaCard) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create draft product from idea
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title: idea.title,
          description: `${idea.listing_copy.subtitle}\n\n${idea.promise}`,
          type: idea.type,
          status: 'draft',
          generation_source: 'idea-lab',
          price: idea.price_band.mid,
          visible: false,
          fulfillment: {}
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Draft created!',
        description: 'Now add your files and details to publish.'
      });

      navigate(`/hub/products/edit/${product.id}`);

    } catch (error: any) {
      console.error('Error creating draft:', error);
      toast({
        title: 'Failed to create draft',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const groupedIdeas = ideas.reduce((acc, idea) => {
    if (!acc[idea.type]) acc[idea.type] = [];
    acc[idea.type].push(idea);
    return acc;
  }, {} as Record<string, IdeaCard[]>);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Idea Lab"
        subtitle="Describe your niche or goal and get 8-12 product ideas you can build and sell."
      />

      <MicroGuidance text="Tell me what you want to create — I'll suggest revenue-ready products across digital, courses, services, and physical items! 💡" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            What do you want to create?
          </CardTitle>
          <CardDescription>
            Describe your niche, expertise, target audience, or business idea
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: I help busy parents meal prep on Sundays. I want to create products that save them time and reduce weeknight stress..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || input.length < 10}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Product Ideas
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {ideas.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedIdeas).map(([type, typeIdeas]) => (
            <div key={type} className="space-y-4">
              <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                {type} Products
                <Badge variant="secondary">{typeIdeas.length}</Badge>
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {typeIdeas.map((idea, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{idea.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          ${idea.price_band.mid}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {idea.listing_copy.subtitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">For:</p>
                        <p className="text-sm text-muted-foreground">{idea.who}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">You'll need:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {idea.what_to_upload.slice(0, 3).map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                      {idea.risk_flags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {idea.risk_flags.map((flag) => (
                            <Badge key={flag} variant="destructive" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        onClick={() => handleUseIdea(idea)}
                        className="flex-1"
                        size="sm"
                      >
                        Use This Idea
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

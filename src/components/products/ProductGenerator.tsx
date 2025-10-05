import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ThumbsUp, ThumbsDown, RefreshCw, Loader2 } from 'lucide-react';
import { generateProductIdeas, type ProductIdea } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ProductGeneratorProps {
  onProductsGenerated: (products: ProductIdea[]) => void;
  onAddProduct: (product: ProductIdea) => void;
}

export const ProductGenerator = ({ onProductsGenerated, onAddProduct }: ProductGeneratorProps) => {
  const [idea, setIdea] = useState('');
  const [products, setProducts] = useState<ProductIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (idea.trim().length < 12) {
      toast({
        title: "Tell us more",
        description: "Please provide at least 12 characters to generate product ideas.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const generatedProducts = await generateProductIdeas({
        idea_text: idea.trim(),
        max_ideas: 4
      });
      setProducts(generatedProducts);
      onProductsGenerated(generatedProducts);
      toast({
        title: "Products generated!",
        description: "Review the ideas below and add the ones you like.",
      });
    } catch (error) {
      console.error('Error generating products:', error);
      toast({
        title: "Generation failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLike = (productId: string) => {
    setLikedProducts(prev => new Set([...prev, productId]));
  };

  const handleDislike = async (productId: string) => {
    setRegeneratingIds(prev => new Set([...prev, productId]));
    try {
      const newProducts = await generateProductIdeas({
        idea_text: idea.trim(),
        max_ideas: 1,
        exclude_ids: products.map(p => p.id)
      });
      
      if (newProducts.length > 0) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? newProducts[0] : p
        ));
      }
    } catch (error) {
      console.error('Error regenerating product:', error);
      toast({
        title: "Regeneration failed",
        description: "Couldn't generate a new idea. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddProduct = (product: ProductIdea) => {
    onAddProduct(product);
    toast({
      title: "Product added!",
      description: `"${product.title}" has been added to your products.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            What do you want to sell?
          </label>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="E.g., Online coaching for entrepreneurs, digital templates for designers, meal prep guides..."
            className="min-h-24 resize-none"
          />
        </div>
        <Button
          variant="hero"
          onClick={handleGenerate}
          disabled={isGenerating || idea.trim().length < 12}
          className="w-full sm:w-auto gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Products
            </>
          )}
        </Button>
      </div>

      {/* Generated products */}
      {products.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Generated Ideas</h3>
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{product.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                    {product.format && (
                      <Badge variant="secondary" className="shrink-0">
                        {product.format}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLike(product.id)}
                      disabled={likedProducts.has(product.id)}
                      className="gap-1.5"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {likedProducts.has(product.id) ? 'Liked' : 'Like'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDislike(product.id)}
                      disabled={regeneratingIds.has(product.id)}
                      className="gap-1.5"
                    >
                      {regeneratingIds.has(product.id) ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Regenerating
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Try another
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAddProduct(product)}
                      className="ml-auto"
                    >
                      Add to Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

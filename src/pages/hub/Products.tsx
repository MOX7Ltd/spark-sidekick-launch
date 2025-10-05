import { useState, useEffect } from 'react';
import { Plus, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductEditor } from '@/components/products/ProductEditor';
import { ProductGenerator } from '@/components/products/ProductGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SkeletonGrid } from '@/components/hub/SkeletonCard';
import { MicroGuidance } from '@/components/hub/MicroGuidance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ProductIdea } from '@/lib/api';

interface Product {
  id: string;
  user_id: string;
  title: string;
  description: string;
  format?: string;
  price?: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Failed to load products",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisible = async (id: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ visible, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, visible } : p
      ));

      toast({
        title: visible ? "Product shown" : "Product hidden",
        description: visible 
          ? "This product is now visible on your shopfront."
          : "This product has been hidden from your shopfront.",
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Update failed",
        description: "Could not update product visibility.",
        variant: "destructive"
      });
    }
  };

  const handleSaveProduct = async (updatedProduct: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: updatedProduct.title,
          description: updatedProduct.description,
          format: updatedProduct.format,
          price: updatedProduct.price,
          visible: updatedProduct.visible,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedProduct.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      ));

      setEditingProduct(null);
      
      toast({
        title: "Product updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Save failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddGeneratedProduct = async (product: ProductIdea) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title: product.title,
          description: product.description,
          format: product.format,
          price: 0,
          visible: false
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      
      toast({
        title: "Product added",
        description: `"${product.title}" has been added to your products.`,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Failed to add product",
        description: "Could not save the product. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Products"
          subtitle="Manage your creations and add them to your shopfront."
        />
        <SkeletonGrid count={3} />
      </div>
    );
  }

  if (editingProduct) {
    return (
      <ProductEditor
        product={editingProduct}
        onSave={handleSaveProduct}
        onCancel={() => setEditingProduct(null)}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Products"
        subtitle="Manage your creations and add them to your shopfront."
        primaryAction={{
          label: 'Create Product',
          icon: Plus,
          onClick: () => setShowGenerator(true),
        }}
      />

      {products.length === 0 ? (
        <div className="space-y-6">
          <MicroGuidance text="Ready to grow your SideHive? Let's spark your next creation. 🐝" />
          <EmptyState
            icon={Package}
            title="You haven't created any products yet"
            description="Let's change that! Use AI to generate your first digital product in seconds."
          />
          <div className="flex justify-center">
            <Button
              variant="hero"
              size="lg"
              onClick={() => setShowGenerator(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Products with AI
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <MicroGuidance text="These products will help you reach your first customers — keep creating! 🚀" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onEdit={(id) => {
                  const product = products.find(p => p.id === id);
                  if (product) setEditingProduct(product);
                }}
                onToggleVisible={handleToggleVisible}
              />
            ))}
          </div>
        </div>
      )}

      {/* Product Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Products with AI
            </DialogTitle>
          </DialogHeader>
          <ProductGenerator
            onProductsGenerated={() => {}}
            onAddProduct={handleAddGeneratedProduct}
          />
        </DialogContent>
      </Dialog>

      {/* Floating mobile CTA */}
      {products.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            variant="hero"
            size="lg"
            onClick={() => setShowGenerator(true)}
            className="rounded-full shadow-lg gap-2"
          >
            <Plus className="h-5 w-5" />
            Create
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { SubHeader } from '@/components/hub/SubHeader';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlaskConical, Search } from 'lucide-react';
import { toast } from 'sonner';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { type ProductStatus } from '@/lib/products';
import { PRODUCT_FAMILIES } from '@/lib/productLab';

interface Product {
  id: string;
  title: string;
  status: string;
  format?: string;
  price?: number;
  fulfillment?: any;
}

export default function ProductsManage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | ProductStatus>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const newProductId = searchParams.get('new');

  useEffect(() => {
    logFrontendEvent({
      eventType: 'step_transition',
      step: 'products_manage',
    });
    fetchProducts();
  }, []);

  useEffect(() => {
    if (newProductId) {
      // Scroll to new product with highlight effect
      setTimeout(() => {
        const element = document.getElementById(`product-${newProductId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [newProductId, products]);

  const fetchProducts = async () => {
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
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, newStatus: ProductStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );

      logFrontendEvent({
        eventType: 'user_action',
        step: 'toggle_publish',
        payload: { product_id: id, to: newStatus },
      });

      toast.success(newStatus === 'live' ? 'Product published!' : 'Product unpublished');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const original = products.find((p) => p.id === id);
      if (!original) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...original,
          id: undefined,
          title: `${original.title} (Copy)`,
          status: 'draft',
          user_id: user.id,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      if (error) throw error;
      setProducts((prev) => [data, ...prev]);
      toast.success('Product duplicated');
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast.error('Failed to duplicate product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesFamily = filterFamily === 'all' || p.format === filterFamily;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesFamily && matchesSearch;
  });

  return (
    <AppSurface>
      <BackBar to="/hub/products" label="Back to Products" />
      <SubHeader
        icon={<FlaskConical className="h-5 w-5" />}
        title="Manage Products"
        subtitle="Polish your offers and go live."
      />

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => navigate('/hub/products/lab')}
            className="bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:opacity-90"
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            Lab
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'draft', 'live', 'hidden'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status as any);
                logFrontendEvent({
                  eventType: 'user_action',
                  step: 'filter_products',
                  payload: { status },
                });
              }}
              className={`text-sm px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-transparent'
                  : 'bg-white/50 border-white/30 hover:bg-white/70'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterFamily('all')}
            className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-all ${
              filterFamily === 'all'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-white/50 border-white/30 hover:bg-white/70'
            }`}
          >
            All Types
          </button>
          {PRODUCT_FAMILIES.map((fam) => (
            <button
              key={fam.key}
              onClick={() => setFilterFamily(fam.key)}
              className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-all ${
                filterFamily === fam.key
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-white/50 border-white/30 hover:bg-white/70'
              }`}
            >
              {fam.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {products.length === 0
                ? 'No products yet. Spark one in the Product Lab.'
                : 'No products match your filters.'}
            </p>
            {products.length === 0 && (
              <Button
                onClick={() => navigate('/hub/products/lab')}
                className="bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:opacity-90"
              >
                <FlaskConical className="h-4 w-4 mr-2" />
                Create in Product Lab
              </Button>
            )}
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <div key={product.id} id={`product-${product.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <ProductCard
                  id={product.id}
                  title={product.title}
                  status={product.status as ProductStatus}
                  family={product.format}
                  price={product.price}
                  priceHigh={product.fulfillment?.price_high}
                  priceModel={product.fulfillment?.price_model || 'one-off'}
                  isNew={product.id === newProductId}
                  onTogglePublish={handleTogglePublish}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              </motion.div>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 px-1 text-sm text-muted-foreground">
        <span className="font-medium text-[color:var(--sh-teal-600)]">Tip:</span> Your products are
        assets. Fine-tune, then go live.
      </p>
    </AppSurface>
  );
}

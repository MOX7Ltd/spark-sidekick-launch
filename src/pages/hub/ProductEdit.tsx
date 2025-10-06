import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Link as LinkIcon, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductType, FULFILLMENT_SPEC } from '@/types/product';

const TYPE_LABELS: Record<ProductType, string> = {
  digital: 'Digital Product',
  course: 'Online Course',
  service: 'Service',
  physical: 'Physical Product'
};

const CHECKLISTS: Record<ProductType, { label: string; field: string }[]> = {
  digital: [
    { label: 'Upload files (PDF, ZIP, etc.)', field: 'files' },
    { label: 'Or add external download links', field: 'external_links' }
  ],
  course: [
    { label: 'Add course syllabus', field: 'syllabus' },
    { label: 'Add lesson titles and URLs', field: 'lessons' }
  ],
  service: [
    { label: 'Write service scope', field: 'scope' },
    { label: 'Add intake form URL', field: 'intake_url' },
    { label: 'Add booking URL (optional)', field: 'booking_url' }
  ],
  physical: [
    { label: 'Upload product photos', field: 'photos' },
    { label: 'Add product options (optional)', field: 'options' },
    { label: 'Set weight and shipping', field: 'weight_grams' }
  ]
};

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      calculateQualityScore();
    }
  }, [product]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data as Product);
    } catch (error: any) {
      console.error('Error loading product:', error);
      toast({
        title: 'Failed to load product',
        description: error.message,
        variant: 'destructive'
      });
      navigate('/hub/products');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateQualityScore = () => {
    if (!product) return;
    let score = 0;

    // Title + cover image → 30 pts
    if (product.title && product.media && product.media.length > 0) score += 30;

    // Benefits 3-7 → 20 pts
    const benefits = product.seo?.keywords?.length || 0;
    if (benefits >= 3 && benefits <= 7) score += 20;

    // Fulfillment checklist satisfied → 30 pts
    if (product.type && product.fulfillment) {
      const required = (FULFILLMENT_SPEC as any)[product.type]?.required || [];
      const satisfied = required.every((field: string) => {
        const value = (product.fulfillment as any)?.[field];
        return value && (Array.isArray(value) ? value.length > 0 : !!value);
      });
      if (satisfied) score += 30;
    }

    // Refund/returns or SLA → 20 pts
    if (product.type === 'physical' || product.type === 'service') {
      if (product.description?.includes('refund') || product.description?.includes('return')) {
        score += 20;
      }
    } else {
      score += 20; // Not applicable for digital/course
    }

    setQualityScore(score);
  };

  const handleSave = async () => {
    if (!product) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          price_cents: product.price_cents,
          media: product.media,
          tags: product.tags,
          fulfillment: product.fulfillment,
          seo: product.seo,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Saved!',
        description: 'Your changes have been saved.'
      });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!product) return;
    
    if (qualityScore < 60) {
      toast({
        title: 'Cannot publish',
        description: 'Please complete the checklist to reach 60% quality before publishing.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'published',
          visible: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Published!',
        description: 'Your product is now live on your shopfront.'
      });
      
      navigate('/hub/products');
    } catch (error: any) {
      toast({
        title: 'Publish failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!product) return null;

  const checklist = product.type ? CHECKLISTS[product.type] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/hub/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <SectionHeader
          title={`Edit ${TYPE_LABELS[product.type || 'digital']}`}
          subtitle={`Draft • Quality: ${qualityScore}%`}
        />
      </div>

      {qualityScore < 60 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Complete the checklist to reach 60% quality before publishing. Current: {qualityScore}%
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={product.title}
                  onChange={(e) => setProduct({ ...product, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={product.subtitle || ''}
                  onChange={(e) => setProduct({ ...product, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={(product.price_cents || 0) / 100}
                  onChange={(e) => setProduct({ ...product, price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fulfillment</CardTitle>
              <CardDescription>
                Add the files, links, or details needed to deliver this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.type === 'digital' && (
                <>
                  <div>
                    <Label>Files (upload not yet implemented)</Label>
                    <Button variant="outline" className="w-full mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                  <div>
                    <Label>External Links</Label>
                    <Input
                      placeholder="https://..."
                      onChange={(e) => {
                        const links = e.target.value ? [e.target.value] : [];
                        setProduct({
                          ...product,
                          fulfillment: { ...product.fulfillment, external_links: links }
                        });
                      }}
                    />
                  </div>
                </>
              )}
              {/* Add similar sections for course, service, physical */}
              <p className="text-sm text-muted-foreground">
                Full fulfillment UI coming soon. For now, save your draft and we'll notify you when ready.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What to Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isSaving || qualityScore < 60}
              variant="default"
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

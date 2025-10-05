import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { AssetPanel } from './AssetPanel';

interface Product {
  id: string;
  title: string;
  description: string;
  format?: string;
  price?: number;
  visible: boolean;
  asset_url?: string;
  asset_status?: string;
  asset_version?: number;
}

interface ProductEditorProps {
  product: Product;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
}

export const ProductEditor = ({ product, onSave, onCancel }: ProductEditorProps) => {
  const [formData, setFormData] = useState<Product>(product);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Product</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Product Name</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="E.g., Complete Guide to Instagram Marketing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what customers will get..."
                className="min-h-32 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Input
                  id="format"
                  value={formData.format || ''}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  placeholder="E.g., E-book, Course, Coaching"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Switch
                id="visible"
                checked={formData.visible}
                onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                disabled={formData.asset_status !== 'ready'}
              />
              <Label htmlFor="visible" className="cursor-pointer flex-1">
                <div className="font-medium">Show on shopfront</div>
                <div className="text-sm text-muted-foreground">
                  {formData.asset_status === 'ready' 
                    ? 'Make this product visible to customers'
                    : 'Attach a file first to publish'
                  }
                </div>
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="hero"
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Asset Panel */}
      <div className="mt-6">
        <AssetPanel
          productId={product.id}
          productName={formData.title}
          productFormat={formData.format}
          description={formData.description || ''}
          assetUrl={formData.asset_url}
          assetStatus={formData.asset_status}
          assetVersion={formData.asset_version}
          onAssetGenerated={() => {
            // Reload product data to get latest asset info
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
};

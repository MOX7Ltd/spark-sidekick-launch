import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { type ProductStatus } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface VisibilitySectionProps {
  status: ProductStatus;
  featured: boolean;
  collections: string[];
  onStatusChange: (status: ProductStatus) => void;
  onFeaturedChange: (featured: boolean) => void;
  onCollectionsChange: (collections: string[]) => void;
}

export function VisibilitySection({
  status,
  featured,
  collections,
  onStatusChange,
  onFeaturedChange,
  onCollectionsChange,
}: VisibilitySectionProps) {
  const [newCollection, setNewCollection] = useState('');

  const addCollection = () => {
    if (newCollection.trim() && !collections.includes(newCollection.trim())) {
      onCollectionsChange([...collections, newCollection.trim()]);
      setNewCollection('');
    }
  };

  const removeCollection = (col: string) => {
    onCollectionsChange(collections.filter((c) => c !== col));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Publish Status</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {status === 'live' ? 'Visible to customers' : 'Hidden from shopfront'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onStatusChange('draft')}
            className={`text-sm px-3 py-2 rounded-lg border transition-all ${
              status === 'draft'
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-white/50 border-white/30 hover:bg-white/70'
            }`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('live')}
            className={`text-sm px-3 py-2 rounded-lg border transition-all ${
              status === 'live'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-white/50 border-white/30 hover:bg-white/70'
            }`}
          >
            Live
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('hidden')}
            className={`text-sm px-3 py-2 rounded-lg border transition-all ${
              status === 'hidden'
                ? 'bg-gray-100 text-gray-700 border-gray-200'
                : 'bg-white/50 border-white/30 hover:bg-white/70'
            }`}
          >
            Hidden
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-white/50 border border-white/30 rounded-lg">
        <Label htmlFor="featured">Feature on shopfront</Label>
        <Switch id="featured" checked={featured} onCheckedChange={onFeaturedChange} />
      </div>

      <div>
        <Label htmlFor="new-collection">Collections / Categories</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="new-collection"
            value={newCollection}
            onChange={(e) => setNewCollection(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCollection())}
            placeholder="e.g., Courses, Templates"
          />
          <button
            type="button"
            onClick={addCollection}
            className="text-sm px-4 py-2 bg-white/50 border border-white/30 rounded-lg hover:bg-white/70 transition-colors whitespace-nowrap"
          >
            Add
          </button>
        </div>
        {collections.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {collections.map((col) => (
              <Badge key={col} variant="secondary" className="flex items-center gap-1">
                {col}
                <button type="button" onClick={() => removeCollection(col)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

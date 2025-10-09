import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal } from 'lucide-react';

export interface DiscoveryState {
  q?: string;
  cat?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: 'relevance' | 'new' | 'price-asc' | 'price-desc';
}

export interface ShopfrontDiscoveryProps {
  value: DiscoveryState;
  onChange: (next: DiscoveryState) => void;
  className?: string;
}

export function ShopfrontDiscovery({ value, onChange, className }: ShopfrontDiscoveryProps) {
  return (
    <div className={cn('px-4 md:px-6', className)}>
      <div className="mx-auto flex max-w-screen-xl items-center gap-2">
        <div className="flex-1">
          <Input
            value={value.q ?? ''}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            placeholder="Search products…"
            className="h-11"
          />
        </div>
        <Button
          variant="outline"
          className="h-11 px-3"
          onClick={() => {
            // Phase 1: simple demo mutation; later open a bottom-sheet.
            onChange({ ...value, sort: value.sort === 'price-asc' ? 'price-desc' : 'price-asc' });
          }}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="mx-auto mt-2 flex max-w-screen-xl flex-wrap gap-2 px-1">
        {(value.tags ?? []).map((t) => (
          <Badge key={t} variant="secondary" className="cursor-pointer">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}

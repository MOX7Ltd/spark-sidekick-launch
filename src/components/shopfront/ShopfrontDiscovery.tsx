import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, Search } from 'lucide-react';

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
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.q ?? ''}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            placeholder="Search products…"
            className="h-12 rounded-full pl-10 shadow-sm"
          />
        </div>
        <Button
          variant="outline"
          className="h-12 rounded-full px-4 shadow-sm"
          onClick={() =>
            onChange({
              ...value,
              sort: value.sort === 'price-asc' ? 'price-desc' : 'price-asc',
            })
          }
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {value.tags && value.tags.length > 0 && (
        <div className="mx-auto mt-3 flex max-w-screen-xl flex-nowrap gap-2 overflow-x-auto px-1">
          {value.tags.map((t) => (
            <Badge key={t} variant="secondary" className="shrink-0 rounded-full">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

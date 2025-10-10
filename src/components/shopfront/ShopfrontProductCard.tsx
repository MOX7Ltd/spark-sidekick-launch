import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProductLike {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  currency?: string;
  tag?: string | null; // e.g., "eBook", "Workshop"
}

export function formatPrice(cents: number, currency = 'NZD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export interface ShopfrontProductCardProps {
  product: ProductLike;
  onAddToCart?: (p: ProductLike) => void;
  className?: string;
}

export function ShopfrontProductCard({ product, onAddToCart, className }: ShopfrontProductCardProps) {
  return (
    <Card className={cn('overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md', className)}>
      <div className="relative aspect-[4/3] w-full bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : null}
        {product.tag && (
          <Badge className="absolute left-3 top-3 rounded-full bg-background/90 backdrop-blur">
            {product.tag}
          </Badge>
        )}
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{product.name}</h3>
          <span className="ml-2 shrink-0 text-sm font-medium">
            {formatPrice(product.priceCents, product.currency)}
          </span>
        </div>
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <Button className="mt-1 w-full h-11" onClick={() => onAddToCart?.(product)}>
          Add to cart
        </Button>
      </CardContent>
    </Card>
  );
}

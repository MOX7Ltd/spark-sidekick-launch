import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface ProductLike {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  currency?: string;
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
}

export function ShopfrontProductCard({ product, onAddToCart }: ShopfrontProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] w-full bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
          <span className="text-sm font-medium">{formatPrice(product.priceCents, product.currency)}</span>
        </div>
        {product.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}
        <Button className="mt-1 w-full" onClick={() => onAddToCart?.(product)}>
          Add to cart
        </Button>
      </CardContent>
    </Card>
  );
}

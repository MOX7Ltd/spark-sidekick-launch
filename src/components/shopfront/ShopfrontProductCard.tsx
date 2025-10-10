import * as React from 'react';
import { FLAGS } from '@/lib/flags';
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
  onMessage?: (productName?: string) => void;
  className?: string;
}

export function ShopfrontProductCard({ product, onAddToCart, onMessage, className }: ShopfrontProductCardProps) {
  return (
    <Card className={cn('group overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', className)}>
      <div className="relative aspect-[4/3] w-full bg-muted">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : null}
        {product.tag && (
          <Badge className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-0.5 text-xs font-medium shadow-sm backdrop-blur">
            {product.tag}
          </Badge>
        )}
      </div>
      <CardContent className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{product.name}</h3>
          <span className="ml-2 shrink-0 text-base font-bold">
            {formatPrice(product.priceCents, product.currency)}
          </span>
        </div>
        {product.description && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-2 flex gap-2">
          <Button className="h-11 flex-1 transition-transform group-hover:scale-[1.01]" onClick={() => onAddToCart?.(product)}>
            Add to cart
          </Button>
          {FLAGS.MESSAGING_V1 && onMessage && (
            <Button variant="ghost" className="h-11" onClick={() => onMessage(product.name)}>
              Ask
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

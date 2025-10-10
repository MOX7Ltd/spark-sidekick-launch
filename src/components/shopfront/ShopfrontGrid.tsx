import * as React from 'react';
import { cn } from '@/lib/utils';
import { ShopfrontProductCard, type ProductLike } from './ShopfrontProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export interface ShopfrontGridProps {
  products: ProductLike[];
  loading?: boolean;
  columnsHint?: number; // 1–4
  onAddToCart?: (p: ProductLike) => void;
  onMessage?: (productName?: string) => void;
  className?: string;
}

export function ShopfrontGrid({
  products,
  loading,
  columnsHint = 3,
  onAddToCart,
  onMessage,
  className,
}: ShopfrontGridProps) {
  const gridCols = columnsHint;
  if (!loading && products.length === 0) {
    return (
      <section className={cn('px-4 md:px-6', className)}>
        <div className="mx-auto max-w-screen-sm rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No matching products. Try clearing filters or changing your search.
        </div>
      </section>
    );
  }

  return (
    <section className={cn('px-4 md:px-6', className)}>
      <div
        className={cn(
          'mx-auto grid max-w-screen-xl gap-4 md:gap-5',
          gridCols >= 4
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : gridCols === 3
            ? 'grid-cols-2 md:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2',
        )}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))
          : products.map((p) => (
              <ShopfrontProductCard key={p.id} product={p} onAddToCart={onAddToCart} onMessage={onMessage} />
            ))}
      </div>
    </section>
  );
}

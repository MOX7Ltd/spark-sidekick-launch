import * as React from 'react';
import { cn } from '@/lib/utils';
import { ShopfrontProductCard, type ProductLike } from './ShopfrontProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export interface ShopfrontGridProps {
  products: ProductLike[];
  loading?: boolean;
  columnsHint?: number; // 1–4
  onAddToCart?: (p: ProductLike) => void;
  className?: string;
}

export function ShopfrontGrid({
  products,
  loading,
  columnsHint = 3,
  onAddToCart,
  className,
}: ShopfrontGridProps) {
  const gridCols = columnsHint;
  return (
    <section className={cn('px-4 md:px-6', className)}>
      <div
        className={cn(
          'mx-auto grid max-w-screen-xl gap-3 md:gap-4',
          gridCols >= 4
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : gridCols === 3
            ? 'grid-cols-2 md:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2',
        )}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))
          : products.map((p) => (
              <ShopfrontProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
      </div>
    </section>
  );
}

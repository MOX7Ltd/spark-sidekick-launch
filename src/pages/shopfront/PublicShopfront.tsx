import * as React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FLAGS } from '@/lib/flags';
import { fetchShopfront } from '@/lib/shopfront/fetchShopfront';
import { ShopfrontView } from '@/components/shopfront/ShopfrontView';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSurface } from '@/components/layout/AppSurface';
import { getOrCreateCart, addItem as cartAddItem } from '@/lib/shopfront/cartApi';

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl space-y-4 px-4 md:px-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PublicShopfront() {
  // Feature flag guard — route becomes inert if flag is off
  if (!FLAGS.SHOPFRONT_V1) return <Navigate to="/" replace />;

  const { handle } = useParams();
  const safeHandle = (handle ?? '').trim();

  const { data, isLoading } = useQuery({
    queryKey: ['shopfront', safeHandle],
    queryFn: async () => {
      if (!safeHandle) return { business: null, settings: null, products: [] };
      return fetchShopfront(safeHandle);
    },
    staleTime: 60_000,
  });

  const business =
    data?.business ?? {
      id: 'placeholder',
      name: safeHandle || 'Shopfront',
      logoUrl: undefined,
      avatarUrl: undefined,
      tagline: 'Your trusted micro-business on SideHive.',
      aboutShort: null,
      contactEmail: null,
    };

  const settings = data?.settings ?? { layout: { columns: 3 } };
  const products = data?.products ?? [];

  return (
    <AppSurface>
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <ShopfrontView
          business={business}
          settings={settings as any}
          products={products as any}
          onQueryChange={() => {}}
        />
      )}
    </AppSurface>
  );
}

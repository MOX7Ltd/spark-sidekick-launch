import * as React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FLAGS } from '@/lib/flags';
import { fetchShopfront } from '@/lib/shopfront/fetchShopfront';
import { ShopfrontView } from '@/components/shopfront/ShopfrontView';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSurface } from '@/components/layout/AppSurface';
import { ErrorBoundary } from '@/components/util/ErrorBoundary';
import { SEOHead } from '@/components/seo/SEOHead';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

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

function EmptyState() {
  return (
    <div className="mx-auto max-w-screen-sm rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
      No products are available yet. Please check back soon.
    </div>
  );
}

export default function PublicShopfront() {
  if (!FLAGS.SHOPFRONT_V1) return <Navigate to="/" replace />;

  const { handle } = useParams();
  const safeHandle = (handle ?? '').trim();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shopfront', safeHandle],
    queryFn: async () => {
      if (!safeHandle) return { business: null, settings: null, products: [] };
      const bundle = await fetchShopfront(safeHandle);
      try { 
        logFrontendEvent?.({
          eventType: 'user_action',
          step: 'shopfront_view',
          payload: { 
            handle: safeHandle, 
            product_count: bundle?.products?.length ?? 0 
          }
        }); 
      } catch {}
      return bundle;
    },
    staleTime: 60_000,
  });

  const business =
    data?.business ?? {
      id: 'placeholder',
      handle: safeHandle || 'shopfront',
      name: safeHandle || 'Shopfront',
      logoUrl: undefined,
      avatarUrl: undefined,
      tagline: 'Your trusted micro-business on SideHive.',
      aboutShort: null,
      contactEmail: null,
    };

  const settings = data?.settings ?? { layout: { columns: 3 } };
  const products = data?.products ?? [];

  const seoTitle = `${business.name} • SideHive Shopfront`;
  const seoDesc = business.tagline ?? business.aboutShort ?? 'Discover products and services from this SideHive micro-business.';
  const seoImg = (business.logoUrl as string | undefined) ?? null;

  return (
    <ErrorBoundary 
      fallback={
        <AppSurface>
          <div className="p-6 text-sm text-red-600">
            We hit a snag loading this shopfront.
          </div>
        </AppSurface>
      }
    >
      <SEOHead title={seoTitle} description={seoDesc} image={seoImg} />
      <AppSurface>
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="mx-auto max-w-screen-sm rounded-xl border bg-card p-6 text-sm text-red-600">
            Sorry, we couldn't load this shopfront.
          </div>
        ) : products.length === 0 ? (
          <>
            <ShopfrontView
              business={business as any}
              settings={settings as any}
              products={[] as any}
              onQueryChange={() => {}}
              disableCart
            />
            <div className="mt-4 px-4 md:px-6">
              <EmptyState />
            </div>
          </>
        ) : (
          <ShopfrontView
            business={business as any}
            settings={settings as any}
            products={products as any}
            onQueryChange={(q) => { 
              try { 
                logFrontendEvent?.({
                  eventType: 'user_action',
                  step: 'shopfront_query_change',
                  payload: q
                }); 
              } catch {} 
            }}
          />
        )}
      </AppSurface>
    </ErrorBoundary>
  );
}

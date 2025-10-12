import * as React from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { FLAGS } from '@/lib/flags';
import { fetchShopfront } from '@/lib/shopfront/fetchShopfront';
import { getShopfrontUrl } from '@/lib/shopfront';
import { ShopfrontView } from '@/components/shopfront/ShopfrontView';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSurface } from '@/components/layout/AppSurface';
import { ErrorBoundary } from '@/components/util/ErrorBoundary';
import { SEOHead } from '@/components/seo/SEOHead';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const safeHandle = (handle ?? '').trim();

  // Check for payment status in URL
  const paymentSuccess = searchParams.get('success') === 'true';
  const paymentCancelled = searchParams.get('cancel') === 'true';

  // Clear payment status from URL after showing message
  React.useEffect(() => {
    if (paymentSuccess || paymentCancelled) {
      const timer = setTimeout(() => {
        searchParams.delete('success');
        searchParams.delete('cancel');
        searchParams.delete('session_id');
        setSearchParams(searchParams, { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, paymentCancelled, searchParams, setSearchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shopfront', safeHandle],
    queryFn: async () => {
      if (!safeHandle) return { business: null, settings: null, products: [], reviews: [] };
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
      starterPaid: false,
      stripeOnboarded: false,
    };

  const settings = data?.settings ?? { layout: { columns: 3 } };
  const products = data?.products ?? [];
  const reviews = data?.reviews ?? [];

  // SEO metadata
  const seoTitle = `${business.name} | SideHive Shopfront`;
  const seoDesc = 
    business.aboutShort?.trim() || 
    business.tagline?.trim() || 
    `Explore ${business.name}'s shopfront on SideHive — a creative marketplace for micro-entrepreneurs.`;
  const seoImg = (business.logoUrl as string | undefined) || '/sidehive-logo.jpg';
  const seoUrl = getShopfrontUrl(business.handle as string);

  // Only index if paid and onboarded
  const isIndexable = Boolean(business.starterPaid && business.stripeOnboarded);

  // JSON-LD structured data for rich search results
  const structuredData = isIndexable ? {
    "@context": "https://schema.org",
    "@type": "Store",
    name: business.name,
    image: seoImg,
    description: seoDesc,
    url: seoUrl,
    brand: {
      "@type": "Brand",
      name: business.name,
      logo: seoImg,
    },
  } : undefined;

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
      <SEOHead 
        title={seoTitle} 
        description={seoDesc} 
        image={seoImg} 
        url={seoUrl}
        businessName={business.name as string}
        isIndexable={isIndexable}
        structuredData={structuredData}
      />
      <AppSurface>
        {/* Payment Status Messages */}
        {FLAGS.STRIPE_PAYMENTS_V1 && paymentSuccess && (
          <div className="mx-auto mb-6 max-w-screen-xl px-4 md:px-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Payment successful! Your order has been confirmed. Thank you for your purchase!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {FLAGS.STRIPE_PAYMENTS_V1 && paymentCancelled && (
          <div className="mx-auto mb-6 max-w-screen-xl px-4 md:px-6">
            <Alert className="border-yellow-200 bg-yellow-50">
              <XCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Payment cancelled. No charges were made. Feel free to browse and try again when ready.
              </AlertDescription>
            </Alert>
          </div>
        )}

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
            reviews={{ 
              avg: settings?.reviews_summary?.avg ?? 0, 
              count: settings?.reviews_summary?.count ?? 0,
              list: reviews 
            }}
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

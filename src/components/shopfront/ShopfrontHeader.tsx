import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface ShopfrontHeaderProps {
  logoUrl?: string | null;
  businessName: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  rating?: { value: number; count: number } | null;
  showPoweredBy?: boolean;
  className?: string;
}

export function ShopfrontHeader({
  logoUrl,
  businessName,
  avatarUrl,
  coverImageUrl,
  rating,
  showPoweredBy = true,
  className,
}: ShopfrontHeaderProps) {
  const initials = React.useMemo(() => businessName?.[0]?.toUpperCase() ?? 'S', [businessName]);

  return (
    <header className={cn('relative', className)}>
      {/* Cover image or gradient hero */}
      <div className="relative h-40 w-full overflow-hidden md:h-56">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            src={coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-muted to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-background/70" />
      </div>

      {/* Identity lockup (overlapping cover) */}
      <div className="px-4 md:px-6">
        <div className="mx-auto -mt-8 max-w-screen-xl">
          <div className="flex items-start gap-4 rounded-2xl border bg-card/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 md:p-5">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-background bg-muted md:h-16 md:w-16">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  loading="lazy"
                  src={logoUrl}
                  alt={`${businessName} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-medium text-muted-foreground">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold leading-tight md:text-xl">{businessName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {rating && rating.count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span aria-hidden className="text-sm">⭐</span>
                    <span className="font-medium">{rating.value.toFixed(1)}</span>
                    <span>({rating.count})</span>
                  </div>
                )}
                {showPoweredBy && (
                  <Badge variant="outline" className="text-[10px] md:text-xs">
                    Powered by <span className="ml-1 font-semibold">SideHive</span>
                  </Badge>
                )}
              </div>
            </div>
            <Avatar className="h-10 w-10 shrink-0 md:h-11 md:w-11">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}

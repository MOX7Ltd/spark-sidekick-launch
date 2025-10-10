import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface ShopfrontHeaderProps {
  logoUrl?: string | null;
  businessName: string;
  avatarUrl?: string | null;
  showPoweredBy?: boolean;
  className?: string;
}

export function ShopfrontHeader({
  logoUrl,
  businessName,
  avatarUrl,
  showPoweredBy = true,
  className,
}: ShopfrontHeaderProps) {
  const initials = React.useMemo(() => businessName?.[0]?.toUpperCase() ?? 'S', [businessName]);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'px-4 py-2 md:px-6',
        className,
      )}
      style={{ paddingTop: 'calc(env(safe-area-inset-top))' }}
    >
      <div className="mx-auto flex max-w-screen-xl items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border bg-muted md:h-12 md:w-12">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" src={logoUrl} alt={`${businessName} logo`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                {initials}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight md:text-lg">{businessName}</span>
            {showPoweredBy && (
              <Badge variant="outline" className="mt-0.5 w-fit text-[10px] md:text-xs">
                Powered by <span className="ml-1 font-semibold">SideHive</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="ml-auto">
          <Avatar className="h-8 w-8 md:h-9 md:w-9">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

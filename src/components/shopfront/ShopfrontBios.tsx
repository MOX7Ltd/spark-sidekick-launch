import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ShopfrontBiosProps {
  businessTagline?: string | null;
  businessAboutShort?: string | null;
  ownerBioShort?: string | null;
  className?: string;
}

export function ShopfrontBios({
  businessTagline,
  businessAboutShort,
  ownerBioShort,
  className,
}: ShopfrontBiosProps) {
  const [expanded, setExpanded] = React.useState(false);
  const body = [businessAboutShort, ownerBioShort].filter(Boolean).join(' · ');
  const needsClamp = !expanded && body && body.length > 240;

  return (
    <section className={cn('px-4 md:px-6', className)}>
      <div className="mx-auto max-w-screen-xl rounded-2xl border bg-card/80 p-4 shadow-sm md:p-5">
        {businessTagline && (
          <p className="text-[15px] font-medium text-foreground md:text-base">
            {businessTagline}
          </p>
        )}
        {body && (
          <div className="mt-2 text-sm text-muted-foreground md:text-[15px]">
            <p className={cn(needsClamp && 'line-clamp-4')}>{body}</p>
            {needsClamp && (
              <Button
                variant="link"
                className="px-0 text-[13px]"
                onClick={() => setExpanded(true)}
              >
                Show more
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

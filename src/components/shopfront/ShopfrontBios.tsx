import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ShopfrontBiosProps {
  businessTagline?: string | null;
  businessAboutShort?: string | null;
  ownerBioShort?: string | null;
  ownerAvatarUrl?: string | null;
  className?: string;
}

export function ShopfrontBios({
  businessTagline,
  businessAboutShort,
  ownerBioShort,
  className,
}: ShopfrontBiosProps) {
  return (
    <section className={cn('px-4 md:px-6', className)}>
      <div className="mx-auto max-w-screen-xl rounded-xl border bg-card p-4 md:p-5">
        <p className="text-sm text-foreground md:text-base">
          {businessTagline || 'Your trusted micro-business on SideHive.'}
        </p>
        {(businessAboutShort || ownerBioShort) && (
          <div className="mt-2 text-xs text-muted-foreground md:text-sm">
            {businessAboutShort}
            {businessAboutShort && ownerBioShort ? ' · ' : ''}
            {ownerBioShort}
          </div>
        )}
      </div>
    </section>
  );
}

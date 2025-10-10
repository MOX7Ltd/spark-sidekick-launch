import * as React from 'react';
import { cn } from '@/lib/utils';
import { Star, Users, ShieldCheck } from 'lucide-react';

export interface SocialProofProps {
  rating?: { value: number; count: number } | null;
  customerCount?: number | null;
  showGuarantee?: boolean;
  className?: string;
}

export function SocialProof({ rating, customerCount, showGuarantee = true, className }: SocialProofProps) {
  const items = [];

  if (rating && rating.count > 0) {
    items.push(
      <div key="rating" className="flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
        <span className="font-medium">{rating.value.toFixed(1)}</span>
        <span className="text-muted-foreground">({rating.count})</span>
      </div>
    );
  }

  if (customerCount && customerCount > 0) {
    items.push(
      <div key="customers" className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Trusted by {customerCount}+ customers</span>
      </div>
    );
  }

  if (showGuarantee) {
    items.push(
      <div key="guarantee" className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Refund guarantee</span>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={cn('px-4 md:px-6', className)}>
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-4 text-xs text-foreground md:gap-6 md:text-sm">
        {items}
      </div>
    </div>
  );
}

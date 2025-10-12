import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, CreditCard, Percent } from "lucide-react";

export function PricingSummaryCard() {
  return (
    <Card className="rounded-2xl shadow-sm border bg-card">
      <CardContent className="space-y-3 text-sm pt-6">
        <div className="flex items-start gap-3">
          <BadgeCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">$10 NZD Starter Pack</p>
            <p className="text-muted-foreground">One-time payment to activate your shopfront</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">14-day free trial + $25 NZD / month</p>
            <p className="text-muted-foreground">Full access to SideHive Pro, cancel anytime</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Percent className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">15% platform fee on each sale</p>
            <p className="text-muted-foreground">Covers Stripe processing, currency conversion, and platform services</p>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            All charges are securely processed by Stripe. You maintain full control and can cancel your subscription at any time from the Billing page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

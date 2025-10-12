import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingFAQModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          How pricing works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>SideHive Pricing Explained</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-1">$10 NZD Starter Pack</h4>
            <p className="text-muted-foreground">
              A one-time payment that covers your initial setup, shopfront activation, and includes a 14-day free trial of SideHive Pro.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">$25 NZD / month subscription</h4>
            <p className="text-muted-foreground">
              After your 14-day trial, you'll be automatically billed $25 NZD monthly for continued access to all SideHive Pro features including analytics, reviews, messaging, and more.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">15% platform fee</h4>
            <p className="text-muted-foreground">
              On each customer sale through your shopfront, SideHive retains 15% to cover Stripe payment processing, currency conversion costs, fraud protection, and ongoing platform services. The remaining 85% is transferred directly to your Stripe Connect account.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Payment Security</h4>
            <p className="text-muted-foreground">
              All payments are processed securely through Stripe, an industry-leading payment processor. SideHive never stores your card details.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Cancellation</h4>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time from your Billing page. Your shopfront will remain accessible until the end of your current billing period.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

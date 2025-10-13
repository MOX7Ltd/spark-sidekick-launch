import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Copy, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HubWelcomeCardProps {
  name?: string;
  shopfrontUrl?: string;
  trialEndIso?: string;
  stripeOnboarded: boolean;
  onConnect: () => void;
}

export const HubWelcomeCard = ({ 
  name, 
  shopfrontUrl, 
  trialEndIso, 
  stripeOnboarded, 
  onConnect 
}: HubWelcomeCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shopfrontUrl) return;
    try {
      await navigator.clipboard.writeText(shopfrontUrl);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Share your shopfront with the world!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const formatTrialEnd = (isoDate?: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const checklist = [
    { id: 'product', text: 'Publish your first product', link: '/hub/products' },
    { id: 'share', text: 'Share your shopfront link', link: null },
    { id: 'message', text: 'Reply to your first customer message', link: '/hub/customers' },
  ];

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl">
          Welcome{name ? `, ${name}` : ''}! 🎉
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shopfront URL */}
        {shopfrontUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Your shopfront is live:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                {shopfrontUrl}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(shopfrontUrl, '_blank')}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Payouts Banner */}
        {!stripeOnboarded && (
          <Alert className="border-amber-500 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Set up payouts to receive money from sales</AlertTitle>
            <AlertDescription className="text-amber-800">
              <Button
                onClick={onConnect}
                size="sm"
                className="mt-2"
              >
                Connect my bank
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Checklist */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Get started:</p>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                {item.link ? (
                  <a 
                    href={item.link} 
                    className="text-sm hover:underline"
                  >
                    {item.text}
                  </a>
                ) : (
                  <span className="text-sm">{item.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trial info */}
        {trialEndIso && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Trial ends {formatTrialEnd(trialEndIso)}. You'll be billed $25/month afterwards. Cancel anytime.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

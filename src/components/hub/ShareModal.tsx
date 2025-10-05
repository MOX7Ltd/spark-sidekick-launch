import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  userName?: string;
  tagline?: string;
}

export const ShareModal = ({ isOpen, onClose, businessName, userName, tagline }: ShareModalProps) => {
  const { toast } = useToast();
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const getShareText = (platform: 'linkedin' | 'instagram' | 'x') => {
    const baseText = `Just launched ${businessName} on @SideHive — AI helped me turn my idea into a business in minutes! 🚀`;
    
    switch (platform) {
      case 'linkedin':
        return `${baseText}\n\n${tagline || ''}\n\nIf you've been thinking about starting a side hustle, this is your sign. Check it out!`;
      case 'instagram':
        return `${baseText}\n\n${tagline || ''}\n\n#SideHustle #Entrepreneur #SmallBusiness #StartupLife`;
      case 'x':
        return `${baseText}\n\n${tagline || ''}`;
      default:
        return baseText;
    }
  };

  const handleCopy = async (platform: 'linkedin' | 'instagram' | 'x') => {
    const text = getShareText(platform);
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatform(platform);
      
      toast({
        title: "Copied!",
        description: `Your ${platform} post is ready to share.`,
      });

      // Mark as shared in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ starter_pack_shared: true })
          .eq('user_id', user.id);

        // Log event
        const sessionId = localStorage.getItem('sessionId') || 'unknown';
        await supabase.from('events').insert({
          session_id: sessionId,
          trace_id: `share-${platform}-${user.id}-${Date.now()}`,
          action: 'launch_shared',
          step: 'share-modal',
          ok: true,
          payload_keys: ['platform'],
        });
      }

      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            📢 Share Your Launch!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Let the world know you've started your journey. Your story might inspire others to take the leap! 🚀
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* LinkedIn */}
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-blue-600">in</span> LinkedIn
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {getShareText('linkedin')}
                  </p>
                </div>
                <Button
                  variant={copiedPlatform === 'linkedin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCopy('linkedin')}
                  className="shrink-0"
                >
                  {copiedPlatform === 'linkedin' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-pink-600">📷</span> Instagram
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {getShareText('instagram')}
                  </p>
                </div>
                <Button
                  variant={copiedPlatform === 'instagram' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCopy('instagram')}
                  className="shrink-0"
                >
                  {copiedPlatform === 'instagram' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* X (Twitter) */}
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span>𝕏</span> X (Twitter)
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {getShareText('x')}
                  </p>
                </div>
                <Button
                  variant={copiedPlatform === 'x' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCopy('x')}
                  className="shrink-0"
                >
                  {copiedPlatform === 'x' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Copy the text for your platform, then paste it into your post. Tag @SideHive to get featured! ✨
        </p>
      </DialogContent>
    </Dialog>
  );
};

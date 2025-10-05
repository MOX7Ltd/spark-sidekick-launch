import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Download, RefreshCw, Loader2, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssetPanelProps {
  productId: string;
  productName: string;
  productFormat?: string;
  description: string;
  assetUrl?: string;
  assetStatus?: string;
  assetVersion?: number;
  onAssetGenerated: () => void;
}

export const AssetPanel = ({
  productId,
  productName,
  productFormat,
  description,
  assetUrl,
  assetStatus,
  assetVersion,
  onAssetGenerated
}: AssetPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async (isRegenerate: boolean = false) => {
    setIsGenerating(true);
    try {
      // Get user's business data for branding
      const { data: { user } } = await supabase.auth.getUser();
      const { data: businesses } = await supabase
        .from('businesses')
        .select('business_name, tagline, logo_svg, brand_colors')
        .eq('owner_id', user?.id)
        .single();

      const { error } = await supabase.functions.invoke('generate-product-asset', {
        body: {
          productId,
          productName,
          productFormat: productFormat || 'Guide',
          description,
          brand: {
            businessName: businesses?.business_name,
            tagline: businesses?.tagline,
            logoUrl: businesses?.logo_svg,
            brandColors: businesses?.brand_colors || ['#6366f1', '#8b5cf6']
          },
          length: 'medium'
        }
      });

      if (error) throw error;

      toast({
        title: isRegenerate ? "Asset regenerating" : "Asset generating",
        description: "This usually takes 30-60 seconds. You can continue editing."
      });

      // Poll for status update
      pollAssetStatus();

    } catch (error) {
      console.error('Error generating asset:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate the asset. Please try again.",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };

  const pollAssetStatus = () => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('products')
        .select('asset_status, asset_url, asset_version')
        .eq('id', productId)
        .single();

      if (data?.asset_status === 'ready') {
        clearInterval(interval);
        setIsGenerating(false);
        onAssetGenerated();
        toast({
          title: "Asset ready!",
          description: "Your draft file has been generated successfully."
        });
      } else if (data?.asset_status === 'failed') {
        clearInterval(interval);
        setIsGenerating(false);
        toast({
          title: "Generation failed",
          description: "Something went wrong. Please try regenerating.",
          variant: "destructive"
        });
      }
    }, 3000);

    // Clear after 2 minutes max
    setTimeout(() => {
      clearInterval(interval);
      setIsGenerating(false);
    }, 120000);
  };

  const handleDownload = () => {
    if (assetUrl) {
      window.open(assetUrl, '_blank');
    }
  };

  // State A: No file yet
  if (!assetStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Draft File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a polished PDF your customers can download
            </p>
            <Button
              variant="hero"
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              ✨ Generate Draft File
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State B: Generating
  if (assetStatus === 'pending' || isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Draft File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">Generating your PDF...</p>
              <p className="text-sm text-muted-foreground">
                This usually takes ~30–60s. You can continue editing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State C: Ready or Failed
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Draft File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assetStatus === 'ready' ? (
          <>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {productName.substring(0, 30)}...v{assetVersion}.pdf
                  </p>
                  <p className="text-xs text-muted-foreground">Ready to download</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Preview / Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                ↻ Regenerate
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Generated by AI. Review before publishing.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Generation failed</p>
                <p className="text-xs text-muted-foreground">Please try again</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Generation
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
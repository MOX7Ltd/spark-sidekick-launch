import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { BrandedPDFTemplate } from './BrandedPDFTemplate';
import { Product } from '@/pages/hub/Products';
import { BusinessIdentity } from '@/lib/db/identity';
import { generateAndUploadPDF } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PDFGeneratorButtonProps {
  product: Product;
  businessIdentity: BusinessIdentity;
  onPDFGenerated: (pdfUrl: string) => void;
}

export const PDFGeneratorButton = ({
  product,
  businessIdentity,
  onPDFGenerated
}: PDFGeneratorButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Wait for next tick to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!printContainerRef.current) {
        throw new Error('Print container not ready');
      }

      const pdfUrl = await generateAndUploadPDF({
        productId: product.id,
        productName: product.title,
        htmlElement: printContainerRef.current,
        userId: user.id
      });

      toast({
        title: '🎉 Your branded PDF is ready!',
        description: 'You can now download it anytime.',
      });

      onPDFGenerated(pdfUrl);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'PDF generation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            Generate PDF
          </>
        )}
      </Button>

      {/* Hidden print container */}
      {createPortal(
        <div
          ref={printContainerRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '0',
            zIndex: -1
          }}
        >
          <BrandedPDFTemplate
            product={product}
            businessIdentity={businessIdentity}
          />
        </div>,
        document.body
      )}
    </>
  );
};

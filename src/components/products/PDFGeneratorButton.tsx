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

      // Capture the inner .pdf-a4 node specifically (not the wrapper)
      const contentNode = printContainerRef.current.querySelector('.pdf-a4') as HTMLElement | null;
      if (!contentNode) {
        console.error('[PDF] .pdf-a4 element not found in DOM');
        throw new Error('PDF template not ready. Please try again.');
      }

      console.log('[PDF] Capturing .pdf-a4 node:', {
        width: contentNode.offsetWidth,
        height: contentNode.offsetHeight,
        innerHTML: contentNode.innerHTML.length
      });

      const pdfUrl = await generateAndUploadPDF({
        productId: product.id,
        productName: product.title,
        htmlElement: contentNode,
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

      {/* Invisible but painted print container */}
      {createPortal(
        <div
          id="pdf-capture-root"
          ref={printContainerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '210mm',
            minHeight: '297mm',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 2147483647
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

import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';
import { waitForPdfReadiness } from './pdfReady';

export interface PDFGenerationOptions {
  productId: string;
  productName: string;
  htmlElement: HTMLElement;
  userId: string;
}

function hasRealContent(el: HTMLElement): boolean {
  const text = (el.innerText || '').trim();
  const hasImages = !!el.querySelector('img,svg');
  console.log('[PDF] Content check:', { textLength: text.length, hasImages });
  return text.length > 10 || hasImages;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uploadPdfBlob(blob: Blob, userId: string, productId: string, filename: string): Promise<string> {
  const filePath = `${userId}/${productId}/${filename}`;
  
  const { error: uploadError } = await supabase.storage
    .from('product-files')
    .upload(filePath, blob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    console.error('[PDF] Upload error:', uploadError);
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('product-files')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

async function generatePdfWithConfig(el: HTMLElement, filename: string, foreignObjectRendering: boolean): Promise<Blob> {
  console.log(`[PDF] Generating with foreignObjectRendering: ${foreignObjectRendering}`);
  
  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.95 },
    html2canvas: {
      scale: Math.min(window.devicePixelRatio || 2, 2),
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      foreignObjectRendering,
      onclone: (doc: Document) => {
        // Force visibility in the cloned DOM
        const cloneEl = doc.querySelector('.pdf-a4') as HTMLElement | null;
        if (cloneEl) {
          Object.assign(cloneEl.style, {
            opacity: '1',
            position: 'static',
            transform: 'none',
            zIndex: '0',
          });
          console.log('[PDF] Clone prepared, opacity set to 1');
        }
        // Force print color accuracy
        const style = doc.createElement('style');
        style.textContent = `*{-webkit-print-color-adjust:exact;print-color-adjust:exact}`;
        doc.head.appendChild(style);
      }
    },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  const pdfArrayBuffer = await html2pdf()
    .set(opt)
    .from(el)
    .outputPdf('arraybuffer');

  const bufferSize = pdfArrayBuffer.byteLength;
  console.log('[PDF] Generated buffer size:', bufferSize, 'bytes');
  
  return new Blob([pdfArrayBuffer], { type: 'application/pdf' });
}

export async function generateAndUploadPDF({
  productId,
  productName,
  htmlElement,
  userId
}: PDFGenerationOptions): Promise<string> {
  console.log('[PDF] === Starting PDF Generation ===');
  
  // Wait for fonts, images, and layout
  await waitForPdfReadiness(htmlElement);

  // Verify content exists
  if (!hasRealContent(htmlElement)) {
    console.error('[PDF] No content detected in element');
    throw new Error('PDF template has no content. Please try again.');
  }

  const filename = `${slugify(productName)}.pdf`;

  // Try with foreignObjectRendering first (better quality)
  let blob = await generatePdfWithConfig(htmlElement, filename, true);
  
  // If PDF is suspiciously small, try without foreignObjectRendering
  if (blob.size < 10000) {
    console.warn('[PDF] First attempt produced tiny PDF, retrying without foreignObjectRendering...');
    blob = await generatePdfWithConfig(htmlElement, filename, false);
    
    if (blob.size < 10000) {
      console.error('[PDF] Both attempts produced tiny PDFs');
      throw new Error(`PDF generation failed - output too small (${blob.size} bytes). Content may not be rendering correctly.`);
    }
  }

  console.log('[PDF] Final PDF size:', blob.size, 'bytes');
  return await uploadPdfBlob(blob, userId, productId, filename);
}

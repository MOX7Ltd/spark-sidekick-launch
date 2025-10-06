import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';
import { waitForPdfReadiness } from './pdfReady';

export interface PDFGenerationOptions {
  productId: string;
  productName: string;
  htmlElement: HTMLElement;
  userId: string;
}

const A4_PX = { w: 794, h: 1123 }; // 210x297mm @ ~96dpi

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

function createHtml2CanvasOptions(foreignObjectRendering: boolean) {
  return {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    width: A4_PX.w,
    height: A4_PX.h,
    foreignObjectRendering,
    onclone: (doc: Document) => {
      const el = doc.querySelector('.pdf-a4') as HTMLElement | null;
      if (el) {
        Object.assign(el.style, {
          opacity: '1',
          position: 'static',
          transform: 'none',
          zIndex: '0',
          marginLeft: '0',
          marginRight: '0'
        });
        
        const computed = doc.defaultView?.getComputedStyle(el);
        console.log('[PDF] Clone computed styles:', {
          opacity: computed?.opacity,
          position: computed?.position,
          transform: computed?.transform,
          width: computed?.width,
          marginLeft: computed?.marginLeft
        });

        // Scan for problematic children
        el.querySelectorAll('*').forEach(node => {
          const cs = doc.defaultView?.getComputedStyle(node as Element);
          if (!cs) return;
          if (
            cs.position === 'sticky' ||
            cs.position === 'fixed' ||
            cs.transform !== 'none' ||
            parseFloat(cs.marginLeft) < 0 ||
            parseFloat(cs.marginRight) < 0
          ) {
            console.warn('[PDF] Suspect node:', {
              tag: (node as HTMLElement).tagName,
              class: (node as HTMLElement).className,
              position: cs.position,
              transform: cs.transform,
              marginLeft: cs.marginLeft,
              marginRight: cs.marginRight
            });
          }
        });
      }

      const style = doc.createElement('style');
      style.textContent = `
        .pdf-a4, .pdf-a4 * {
          transform: none !important;
          position: static !important;
          filter: none !important;
          overflow: visible !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        .pdf-a4 { left: 0 !important; top: 0 !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `;
      doc.head.appendChild(style);
    }
  };
}

async function preflightDiagnostics(el: HTMLElement): Promise<void> {
  const rect = el.getBoundingClientRect();
  const computed = getComputedStyle(el);
  
  console.log('[PDF] Pre-capture diagnostics:', {
    selector: '.pdf-a4',
    tagName: el.tagName,
    className: el.className,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    offset: { width: el.offsetWidth, height: el.offsetHeight },
    scroll: { width: el.scrollWidth, height: el.scrollHeight },
    computed: {
      position: computed.position,
      transform: computed.transform,
      opacity: computed.opacity,
      width: computed.width,
      marginLeft: computed.marginLeft,
      marginRight: computed.marginRight,
      paddingLeft: computed.paddingLeft,
      paddingRight: computed.paddingRight
    }
  });
}

async function generatePdfWithConfig(el: HTMLElement, filename: string, foreignObjectRendering: boolean): Promise<Blob> {
  console.log(`[PDF] Generating with foreignObjectRendering: ${foreignObjectRendering}`);
  
  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.95 },
    html2canvas: createHtml2CanvasOptions(foreignObjectRendering),
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

  // Run diagnostics
  await preflightDiagnostics(htmlElement);

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

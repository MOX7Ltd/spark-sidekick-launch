import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';
import { waitForPdfReadiness, roughlyHasContent } from './pdfReady';

export interface PDFGenerationOptions {
  productId: string;
  productName: string;
  htmlElement: HTMLElement;
  userId: string;
}

export async function generateAndUploadPDF({
  productId,
  productName,
  htmlElement,
  userId
}: PDFGenerationOptions): Promise<string> {
  // Wait for fonts, images, and layout
  await waitForPdfReadiness(htmlElement);

  // Verify content exists
  if (!roughlyHasContent(htmlElement)) {
    console.error('[PDF] No content detected in element');
    throw new Error('PDF template has no content. Please try again.');
  }

  // Log element dimensions for debugging
  console.log('[PDF] Element dimensions:', {
    width: htmlElement.offsetWidth,
    height: htmlElement.offsetHeight,
    contentLength: htmlElement.innerHTML.length
  });

  // Slugify product name for filename
  const slugifiedName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const filename = `${slugifiedName}.pdf`;

  // Generate PDF as array buffer
  const pdfArrayBuffer = await html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: Math.min(window.devicePixelRatio || 2, 2),
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        windowWidth: htmlElement.scrollWidth,
        windowHeight: htmlElement.scrollHeight
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(htmlElement)
    .outputPdf('arraybuffer');

  // Log PDF buffer size
  const bufferSize = pdfArrayBuffer.byteLength;
  console.log('[PDF] Generated buffer size:', bufferSize, 'bytes');
  
  if (bufferSize < 10000) {
    console.warn('[PDF] Buffer size suspiciously small, PDF may be blank');
  }

  // Upload to Supabase Storage
  const filePath = `${userId}/${productId}/${filename}`;
  
  const { error: uploadError } = await supabase.storage
    .from('product-files')
    .upload(filePath, pdfArrayBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product-files')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

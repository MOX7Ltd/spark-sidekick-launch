import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';

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
  // Slugify product name for filename
  const slugifiedName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const filename = `${slugifiedName}.pdf`;

  // Generate PDF as array buffer
  const pdfArrayBuffer = await html2pdf()
    .set({
      margin: 18,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(htmlElement)
    .outputPdf('arraybuffer');

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

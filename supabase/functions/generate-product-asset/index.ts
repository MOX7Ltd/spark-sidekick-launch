import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateAssetRequest {
  productId: string;
  productName: string;
  productFormat: string;
  description: string;
  audiences?: string[];
  vibes?: string[];
  brand?: {
    businessName?: string;
    tagline?: string;
  };
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

interface AssetBlueprint {
  title: string;
  subtitle: string;
  sections: Array<{
    heading: string;
    body?: string;
    bullets?: string[];
  }>;
  callouts?: Array<{
    title: string;
    text: string;
  }>;
  cta?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: GenerateAssetRequest = await req.json();
    const { productId, productName, productFormat, description, audiences, vibes, brand, tone, length } = body;

    console.log(`[generate-product-asset] Processing product: ${productId}`);

    // Update status to pending
    await supabaseClient
      .from('products')
      .update({ asset_status: 'pending' })
      .eq('id', productId);

    // Build AI prompt based on format
    const blueprint = getAssetBlueprint(productFormat);
    const prompt = buildPrompt(productName, productFormat, description, blueprint, audiences, vibes, brand, tone, length);

    // Call Lovable AI to generate structured content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert at creating professional digital products. Generate well-structured, actionable content. Do not hallucinate prices, links, or outcome promises. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-product-asset] AI API error:', errorText);
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const content: AssetBlueprint = JSON.parse(aiData.choices[0].message.content);

    // Convert to HTML
    const html = generateHTML(content, brand);

    // Convert HTML to PDF using a simple HTML-to-PDF approach
    // For production, you'd use Puppeteer or similar, but for MVP we'll store HTML
    // and let the client handle PDF conversion or use a simple conversion
    const pdfBuffer = await convertHTMLToPDF(html);

    // Get current version
    const { data: product } = await supabaseClient
      .from('products')
      .select('asset_version')
      .eq('id', productId)
      .single();

    const version = (product?.asset_version || 0) + 1;

    // Upload to storage
    const storagePath = `${productId}/${version}.pdf`;
    const { error: uploadError } = await supabaseClient.storage
      .from('product-assets')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('[generate-product-asset] Upload error:', uploadError);
      throw uploadError;
    }

    // Get signed URL (valid for 1 year for drafts)
    const { data: urlData } = await supabaseClient.storage
      .from('product-assets')
      .createSignedUrl(storagePath, 31536000);

    if (!urlData?.signedUrl) {
      throw new Error('Failed to create signed URL');
    }

    // Update product record
    await supabaseClient
      .from('products')
      .update({
        asset_url: urlData.signedUrl,
        asset_type: 'pdf',
        asset_status: 'ready',
        asset_version: version
      })
      .eq('id', productId);

    // Insert into product_assets history
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    }

    await supabaseClient
      .from('product_assets')
      .insert({
        product_id: productId,
        version,
        type: 'pdf',
        storage_path: storagePath,
        created_by: userId,
        meta: { content }
      });

    console.log(`[generate-product-asset] Success for product ${productId}, version ${version}`);

    return new Response(
      JSON.stringify({
        status: 'ready',
        url: urlData.signedUrl,
        version
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[generate-product-asset] Error:', error);

    // Try to update status to failed if we have productId
    try {
      const body = await req.json();
      if (body.productId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabaseClient
          .from('products')
          .update({ asset_status: 'failed' })
          .eq('id', body.productId);
      }
    } catch (updateError) {
      console.error('[generate-product-asset] Failed to update error status:', updateError);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function getAssetBlueprint(format: string): string {
  const blueprints: Record<string, string> = {
    'Checklist': 'Sections: Purpose, How to Use, Step-by-Step Checklist, Pro Tips, Additional Resources',
    'Guide': 'Sections: Introduction, Core Objectives, Step-by-Step Guide, Worksheets/Exercises, FAQs, Resources',
    'Playbook': 'Sections: Overview, Strategic Framework, Implementation Steps, Templates, Best Practices, Resources',
    'Workbook': 'Sections: Welcome, Module 1-3 (with prompts and fillable exercises), Reflection Questions, Next Steps',
    'Toolkit': 'Sections: Getting Started, Tool Overview, Implementation Guide, Templates, Troubleshooting, Resources',
    'Manual': 'Sections: Introduction, Setup, Core Features, Advanced Usage, Troubleshooting, Reference Guide',
    'Coaching Pack': 'Sections: Program Overview, Session Plans (3-5 sessions), Pre-Work Materials, Homework Templates, Progress Tracker, Resources',
    'Course': 'Sections: Course Overview, Learning Objectives, Lesson 1-5 (with activities), Knowledge Checks, Final Project, Resources'
  };

  return blueprints[format] || blueprints['Guide'];
}

function buildPrompt(name: string, format: string, description: string, blueprint: string, audiences?: string[], vibes?: string[], brand?: any, tone?: string, length?: string): string {
  const lengthGuide = length === 'short' ? '3-4 concise sections' : length === 'long' ? '6-8 comprehensive sections' : '4-6 well-balanced sections';
  
  return `Create a professional ${format} titled "${name}".

Description: ${description}

Target Audience: ${audiences?.join(', ') || 'general audience'}
Tone/Vibe: ${tone || vibes?.join(', ') || 'professional and helpful'}
Brand: ${brand?.businessName || 'SideHive'} ${brand?.tagline ? `- ${brand.tagline}` : ''}

Structure: ${blueprint}
Length: ${lengthGuide}

Return a JSON object with this structure:
{
  "title": "...",
  "subtitle": "...",
  "sections": [
    {"heading": "...", "body": "..."},
    {"heading": "...", "bullets": ["...", "..."]}
  ],
  "callouts": [{"title": "Pro Tip", "text": "..."}],
  "cta": "What's your next step?"
}

Requirements:
- Professional, actionable content
- No hallucinated prices, links, or outcome guarantees
- Appropriate depth for a ${format}
- Clear, scannable formatting
- Helpful tips and examples where relevant`;
}

function generateHTML(content: AssetBlueprint, brand?: any): string {
  const businessName = brand?.businessName || 'SideHive';
  const tagline = brand?.tagline || '';
  const logoUrl = brand?.logoUrl || '';
  const brandColors = brand?.brandColors || ['#6366f1', '#8b5cf6'];
  const primaryColor = brandColors[0] || '#6366f1';
  const accentColor = brandColors[1] || primaryColor;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4; 
      margin: 0; 
    }
    
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.7;
      color: #1a1a1a;
      background: white;
      padding: 40px 50px;
    }
    
    header {
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 24px;
      margin-bottom: 40px;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      flex-shrink: 0;
    }
    
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .header-text {
      flex: 1;
    }
    
    .business-name {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    
    .tagline {
      color: #666;
      font-size: 14px;
    }
    
    .product-title {
      font-size: 36px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 12px;
      line-height: 1.2;
    }
    
    .product-subtitle {
      font-size: 18px;
      color: #555;
      margin-bottom: 32px;
      font-weight: 500;
    }
    
    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    
    .section h3 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${accentColor};
    }
    
    .section p {
      margin-bottom: 16px;
      font-size: 15px;
      color: #333;
      line-height: 1.7;
    }
    
    .section ul {
      margin: 16px 0;
      padding-left: 28px;
    }
    
    .section li {
      margin-bottom: 10px;
      font-size: 15px;
      color: #333;
      line-height: 1.6;
    }
    
    .section li::marker {
      color: ${primaryColor};
      font-weight: 600;
    }
    
    .callout {
      background: linear-gradient(135deg, ${primaryColor}10, ${accentColor}10);
      border-left: 4px solid ${primaryColor};
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    
    .callout-title {
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 8px;
      font-size: 16px;
    }
    
    .callout p {
      color: #333;
      font-size: 15px;
      margin: 0;
    }
    
    .cta {
      background: linear-gradient(135deg, ${primaryColor}, ${accentColor});
      color: white;
      padding: 24px;
      text-align: center;
      margin: 40px 0;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      page-break-inside: avoid;
    }
    
    footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 13px;
      color: #666;
    }
    
    footer p {
      margin: 4px 0;
    }
    
    @media print {
      body { 
        print-color-adjust: exact; 
        -webkit-print-color-adjust: exact; 
      }
    }
  </style>
</head>
<body>
  <header>
    ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="${businessName} Logo" /></div>` : ''}
    <div class="header-text">
      <div class="business-name">${businessName}</div>
      ${tagline ? `<div class="tagline">${tagline}</div>` : ''}
    </div>
  </header>
  
  <main>
    <h1 class="product-title">${content.title}</h1>
    ${content.subtitle ? `<p class="product-subtitle">${content.subtitle}</p>` : ''}
    
    ${content.sections.map(section => `
      <div class="section">
        <h3>${section.heading}</h3>
        ${section.body ? `<p>${section.body}</p>` : ''}
        ${section.bullets && section.bullets.length > 0 ? `
          <ul>
            ${section.bullets.map(bullet => `<li>${bullet}</li>`).join('\n            ')}
          </ul>
        ` : ''}
      </div>
    `).join('\n    ')}
    
    ${content.callouts && content.callouts.length > 0 ? content.callouts.map(callout => `
      <div class="callout">
        <div class="callout-title">${callout.title}</div>
        <p>${callout.text}</p>
      </div>
    `).join('\n    ') : ''}
    
    ${content.cta ? `<div class="cta">${content.cta}</div>` : ''}
  </main>
  
  <footer>
    <p>Made with ❤️ on SideHive</p>
    <p>© ${new Date().getFullYear()} ${businessName}</p>
  </footer>
</body>
</html>
  `.trim();
}

// PDF conversion using Playwright's Chromium
async function convertHTMLToPDF(html: string): Promise<Uint8Array> {
  try {
    console.log('[convertHTMLToPDF] Starting Playwright PDF generation');
    
    // Import Playwright's chromium
    const { chromium } = await import("https://deno.land/x/playwright@1.40.0/index.ts");
    
    // Launch browser in headless mode
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for network to be idle
    await page.setContent(html, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '24mm', 
        right: '18mm', 
        bottom: '18mm', 
        left: '18mm' 
      },
      preferCSSPageSize: false
    });
    
    await browser.close();
    
    console.log('[convertHTMLToPDF] PDF generated successfully, size:', pdfBuffer.length);
    return pdfBuffer;
  } catch (error) {
    console.error('[convertHTMLToPDF] Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF generation failed: ${errorMessage}`);
  }
}
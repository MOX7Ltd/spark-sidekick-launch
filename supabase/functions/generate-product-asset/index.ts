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
  const brandName = brand?.businessName || 'SideHive';
  const tagline = brand?.tagline || '';

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #18A0B0; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #18A0B0; font-size: 28px; }
    .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
    .title { text-align: center; margin-bottom: 40px; }
    .title h2 { font-size: 24px; color: #333; margin-bottom: 10px; }
    .title p { color: #666; font-size: 16px; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section h3 { color: #18A0B0; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; }
    .section p { margin-bottom: 15px; }
    .section ul { margin: 10px 0; padding-left: 25px; }
    .section li { margin-bottom: 8px; }
    .callout { background: #f8f9fa; border-left: 4px solid #18A0B0; padding: 15px; margin: 20px 0; page-break-inside: avoid; }
    .callout-title { font-weight: bold; color: #18A0B0; margin-bottom: 8px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center; font-size: 12px; color: #999; }
    .cta { background: #18A0B0; color: white; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; font-size: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${brandName}</h1>
    ${tagline ? `<p>${tagline}</p>` : ''}
  </div>
  
  <div class="title">
    <h2>${content.title}</h2>
    ${content.subtitle ? `<p>${content.subtitle}</p>` : ''}
  </div>
`;

  // Add sections
  for (const section of content.sections) {
    html += `  <div class="section">\n    <h3>${section.heading}</h3>\n`;
    if (section.body) {
      html += `    <p>${section.body}</p>\n`;
    }
    if (section.bullets && section.bullets.length > 0) {
      html += `    <ul>\n`;
      for (const bullet of section.bullets) {
        html += `      <li>${bullet}</li>\n`;
      }
      html += `    </ul>\n`;
    }
    html += `  </div>\n`;
  }

  // Add callouts
  if (content.callouts && content.callouts.length > 0) {
    for (const callout of content.callouts) {
      html += `  <div class="callout">\n    <div class="callout-title">${callout.title}</div>\n    <p>${callout.text}</p>\n  </div>\n`;
    }
  }

  // Add CTA
  if (content.cta) {
    html += `  <div class="cta">${content.cta}</div>\n`;
  }

  // Add footer
  html += `
  <div class="footer">
    <p>Generated by AI. Review before publishing.</p>
    <p>© ${new Date().getFullYear()} ${brandName}</p>
  </div>
</body>
</html>`;

  return html;
}

async function convertHTMLToPDF(html: string): Promise<Uint8Array> {
  // For MVP, we'll use a simple HTML to PDF conversion
  // In production, you'd use Puppeteer or a dedicated PDF service
  
  // Using a basic approach: encode HTML as a simple PDF-like structure
  // This is a placeholder - in production use proper PDF generation
  const encoder = new TextEncoder();
  return encoder.encode(html);
}
import { useEffect, useState } from "react";
import { Product } from "@/pages/hub/Products";
import { BusinessIdentity } from "@/lib/db/identity";
import { buildAIBaseline, Baseline } from "@/lib/aiProductBaseline";

interface BrandedPDFTemplateProps {
  product: Product;
  businessIdentity: BusinessIdentity;
}

export const BrandedPDFTemplate = ({ product, businessIdentity }: BrandedPDFTemplateProps) => {
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  useEffect(() => {
    buildAIBaseline(product, businessIdentity).then(setBaseline);
  }, [product, businessIdentity]);

  if (!baseline) return null;

  return (
    <div 
      className="pdf-a4"
      style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '16mm',
      backgroundColor: 'white',
      fontFamily: "'Inter', 'system-ui', sans-serif",
      color: '#1a1a1a',
      boxSizing: 'border-box'
    }}>
      {/* Header with brand color bar and logo */}
      <div style={{
        borderTop: `6px solid ${baseline.brand.primary}`,
        paddingTop: '24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {baseline.brand.logoSvg && (
          <div 
            dangerouslySetInnerHTML={{ __html: baseline.brand.logoSvg }}
            style={{ width: '120px', height: 'auto' }}
          />
        )}
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {businessIdentity.business_name}
          </h2>
          {businessIdentity.tagline && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              {businessIdentity.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Product Title */}
      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: baseline.brand.primary,
        marginBottom: '8px',
        lineHeight: 1.2
      }}>
        {baseline.headline}
      </h1>

      {/* Subheadline */}
      <p style={{
        fontSize: '16px',
        color: '#666',
        marginTop: '4px',
        marginBottom: '24px'
      }}>
        {baseline.subheadline}
      </p>

      {/* Key Benefits */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
          Key Benefits
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
          {baseline.bullets.map((bullet, i) => (
            <li key={i} style={{ marginBottom: '8px' }}>{bullet}</li>
          ))}
        </ul>
      </div>

      {/* Description */}
      <div style={{
        fontSize: '16px',
        lineHeight: 1.8,
        color: '#333',
        marginBottom: '24px',
        whiteSpace: 'pre-wrap'
      }}>
        {baseline.body}
      </div>

      {/* Features Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '16px',
        marginBottom: '24px'
      }}>
        <tbody>
          {baseline.features.map((feature, i) => (
            <tr key={i}>
              <td style={{
                fontWeight: 600,
                padding: '8px 0',
                borderBottom: '1px solid #e0e0e0',
                width: '40%'
              }}>
                {feature.label}
              </td>
              <td style={{
                padding: '8px 0',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {feature.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Price */}
      {baseline.priceBlock && (
        <div style={{
          padding: '24px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
            Investment
          </p>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: baseline.brand.primary }}>
            {baseline.priceBlock.price}
          </p>
          {baseline.priceBlock.note && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
              {baseline.priceBlock.note}
            </p>
          )}
        </div>
      )}

      {/* CTA Section */}
      <div style={{
        padding: '24px',
        backgroundColor: `${baseline.brand.primary}08`,
        borderLeft: `4px solid ${baseline.brand.primary}`,
        borderRadius: '8px',
        marginTop: '32px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
          Ready to Get Started?
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
          {baseline.cta}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '48px',
        paddingTop: '16px',
        borderTop: '1px solid #e0e0e0',
        fontSize: '12px',
        color: '#999',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0 }}>
          {businessIdentity.business_name} • Made with ❤️ on SideHive
        </p>
      </div>
    </div>
  );
};

import { Product } from "@/pages/hub/Products";
import { BusinessIdentity } from "@/lib/db/identity";

interface BrandedPDFTemplateProps {
  product: Product;
  businessIdentity: BusinessIdentity;
}

export const BrandedPDFTemplate = ({ product, businessIdentity }: BrandedPDFTemplateProps) => {
  const primaryColor = businessIdentity.brand_colors?.[0] || '#1A4D8F';
  const tone = businessIdentity.idea?.toLowerCase().includes('playful') || 
                businessIdentity.idea?.toLowerCase().includes('fun') 
                ? 'uplifting and energetic' 
                : 'clear and professional';

  return (
    <div style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '18mm',
      backgroundColor: 'white',
      fontFamily: "'Inter', sans-serif",
      color: '#1a1a1a',
      position: 'relative'
    }}>
      {/* Header with brand color bar and logo */}
      <div style={{
        borderTop: `6px solid ${primaryColor}`,
        paddingTop: '24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {businessIdentity.logo_svg && (
          <div 
            dangerouslySetInnerHTML={{ __html: businessIdentity.logo_svg }}
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
        color: primaryColor,
        marginBottom: '8px',
        lineHeight: 1.2
      }}>
        {product.title}
      </h1>

      {/* Format Badge */}
      {product.format && (
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          backgroundColor: `${primaryColor}15`,
          color: primaryColor,
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '24px'
        }}>
          {product.format}
        </div>
      )}

      {/* Description */}
      <div style={{
        fontSize: '16px',
        lineHeight: 1.8,
        color: '#333',
        marginBottom: '32px',
        whiteSpace: 'pre-wrap'
      }}>
        {product.description}
      </div>

      {/* Price */}
      {product.price && (
        <div style={{
          padding: '24px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '32px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
            Investment
          </p>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: primaryColor }}>
            ${Number(product.price).toFixed(2)}
          </p>
        </div>
      )}

      {/* CTA Section */}
      <div style={{
        padding: '24px',
        backgroundColor: `${primaryColor}08`,
        borderLeft: `4px solid ${primaryColor}`,
        borderRadius: '8px',
        marginTop: '48px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
          {tone === 'uplifting and energetic' 
            ? "Ready to Get Started? 🚀" 
            : "Ready to Begin?"}
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
          {tone === 'uplifting and energetic'
            ? "Let's make this happen together! Reach out to get started on your journey."
            : "Contact us to learn more about this offering and how we can help you achieve your goals."}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '18mm',
        left: '18mm',
        right: '18mm',
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

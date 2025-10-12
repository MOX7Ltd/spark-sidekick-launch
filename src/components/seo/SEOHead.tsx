import * as React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEOHead(props: {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
  businessName?: string;
  isIndexable?: boolean;
  structuredData?: Record<string, any>;
}) {
  const { 
    title, 
    description, 
    image, 
    url, 
    businessName,
    isIndexable = true,
    structuredData 
  } = props;

  return (
    <Helmet>
      {/* Basic SEO */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      
      {/* Robots directive */}
      <meta name="robots" content={isIndexable ? "index,follow" : "noindex,nofollow"} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SideHive" />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      
      {/* Twitter (X) Card */}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

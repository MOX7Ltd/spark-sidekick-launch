import { Card, CardContent } from '@/components/ui/card';

interface ShopfrontHeaderPreviewProps {
  name: string;
  tagline?: string;
  bio?: string;
  logoSvg?: string;
  colors: string[];
}

export const ShopfrontHeaderPreview = ({
  name,
  tagline,
  bio,
  logoSvg,
  colors
}: ShopfrontHeaderPreviewProps) => {
  const primaryColor = colors[0] || '#0ea5e9';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Shopfront Preview</h3>
        <p className="text-xs text-muted-foreground">
          This is what customers see
        </p>
      </div>
      
      <Card className="overflow-hidden border-2">
        <div 
          className="h-24 relative"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`
          }}
        />
        <CardContent className="pt-0 px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 -mt-12">
            {/* Logo */}
            <div className="shrink-0">
              {logoSvg ? (
                <div 
                  className="w-24 h-24 rounded-lg bg-background border-4 border-background shadow-lg flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: logoSvg }}
                />
              ) : (
                <div 
                  className="w-24 h-24 rounded-lg bg-background border-4 border-background shadow-lg flex items-center justify-center text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {name.charAt(0)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 mt-4 md:mt-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{name}</h1>
              {tagline && (
                <p className="text-sm md:text-base text-muted-foreground mb-3">
                  {tagline}
                </p>
              )}
              
              {bio && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    About
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {bio}
                  </p>
                </div>
              )}

              {/* Color palette */}
              {colors.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground text-center">
        Full shopfront features are in your Products section
      </p>
    </div>
  );
};

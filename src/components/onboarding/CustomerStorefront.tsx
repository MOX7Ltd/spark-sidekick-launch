import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Star, Sparkles } from 'lucide-react';
import { FLAGS } from '@/lib/flags';
import { ShopfrontView } from '@/components/shopfront/ShopfrontView';
import { adaptOnboardingToShopfront } from '@/lib/shopfront/onboardingAdapter';

interface Product {
  id?: string;
  title: string;
  type?: string;
  format?: string;
  price?: string;
  description: string;
}

interface CustomerStorefrontProps {
  idea: string;
  aboutYou: {
    firstName: string;
    lastName: string;
    expertise: string;
    styles?: string[];
    profilePicture?: string;
  };
  audience: string;
  businessIdentity: {
    name: string;
    logo: string;
    tagline?: string;
    bio?: string;
    colors?: string[];
    logoSVG?: string;
  };
  introCampaign?: {
    shortPost: {
      caption: string;
      hashtags: string[];
    };
    longPost: {
      caption: string;
    };
  };
  products?: Array<{
    id?: string;
    title: string;
    format?: string;
    description: string;
  }>;
}

// Legacy component (keep existing preview behavior when flag is off)
const LegacyCustomerStorefront = ({ idea, aboutYou, audience, businessIdentity, introCampaign, products: providedProducts }: CustomerStorefrontProps) => {
  // Use provided products or generate fallback products
  const generateFallbackProducts = () => {
    const ideaLower = idea.toLowerCase();
    const isGuideIdea = ideaLower.includes('guide') || ideaLower.includes('course');
    const isCoachingIdea = ideaLower.includes('coaching') || ideaLower.includes('consulting');
    
    if (isGuideIdea) {
      return [
        { 
          title: "Complete Starter Guide", 
          type: "Digital Download", 
          price: "$47",
          description: "Everything you need to get started, step by step"
        },
        { 
          title: "Quick Reference Templates", 
          type: "Template Pack", 
          price: "$27",
          description: "Time-saving templates you can use immediately"
        },
        { 
          title: "Video Walkthrough Series", 
          type: "Video Course", 
          price: "$97",
          description: "Watch over my shoulder as I guide you through"
        }
      ];
    } else if (isCoachingIdea) {
      return [
        { 
          title: "1:1 Strategy Session", 
          type: "Consultation", 
          price: "$149",
          description: "Personal guidance tailored to your situation"
        },
        { 
          title: "Group Coaching Program", 
          type: "8-Week Course", 
          price: "$297",
          description: "Join a community and learn together"
        },
        { 
          title: "Quick Win Checklist", 
          type: "Digital Download", 
          price: "$19",
          description: "Start seeing results in the next 24 hours"
        }
      ];
    } else {
      return [
        { 
          title: "Getting Started Blueprint", 
          type: "Digital Guide", 
          price: "$39",
          description: "Your roadmap to success with clear action steps"
        },
        { 
          title: "Done-For-You Templates", 
          type: "Template Pack", 
          price: "$29",
          description: "Plug-and-play resources that save you hours"
        },
        { 
          title: "Premium Support Package", 
          type: "Ongoing Support", 
          price: "$197",
          description: "Get answers to your questions as you go"
        }
      ];
    }
  };

  const products = providedProducts || generateFallbackProducts();
  const bio = businessIdentity?.bio || `Hi! I'm ${aboutYou.firstName}. ${aboutYou.expertise}`;
  const tagline = businessIdentity?.tagline || "Helping you succeed";
  const fullName = [aboutYou.firstName, aboutYou.lastName].filter(Boolean).join(' ');

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Storefront Header - Like a real website hero */}
      <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-x border-t">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative px-8 py-12 text-center">
          {/* Logo */}
          {businessIdentity?.logoSVG ? (
            businessIdentity.logoSVG.trim().startsWith('<') ? (
              // It's SVG markup
              <div 
                className="w-24 h-24 mx-auto mb-6 bg-background rounded-full flex items-center justify-center overflow-hidden shadow-lg border-4 border-background"
                dangerouslySetInnerHTML={{ __html: businessIdentity.logoSVG }}
              />
            ) : (
              // It's an image URL
              <div className="w-24 h-24 mx-auto mb-6 bg-background rounded-full flex items-center justify-center overflow-hidden shadow-lg border-4 border-background">
                <img 
                  src={businessIdentity.logoSVG} 
                  alt={businessIdentity.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )
          ) : (
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {businessIdentity.name.charAt(0)}
            </div>
          )}
          
          {/* Business Name & Tagline */}
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {businessIdentity.name}
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            {tagline}
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-muted-foreground">Trusted by 500+ customers</span>
          </div>
        </div>
      </div>

      {/* About Section */}
      <Card className="rounded-none border-x">
        <CardContent className="px-8 py-8">
          <div className="flex items-start gap-6">
            {aboutYou.profilePicture ? (
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary">
                <img src={aboutYou.profilePicture} alt={fullName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">About {fullName || 'the Founder'}</h2>
              <p className="text-lg leading-relaxed text-foreground/90">
                {bio}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intro Campaign Preview - Two Versions */}
      {introCampaign && (
        <Card className="rounded-none border-x bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="px-8 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Short Version */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">You</span>
                  </div>
                  <div>
                    <p className="font-semibold">{aboutYou.firstName} {aboutYou.lastName}</p>
                    <p className="text-xs text-muted-foreground">Short Launch Post</p>
                  </div>
                </div>
                
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-5 border-2 border-primary/20">
                  <p className="text-base leading-relaxed mb-3">{introCampaign.shortPost.caption}</p>
                  <div className="flex flex-wrap gap-2">
                    {introCampaign.shortPost.hashtags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Long Version */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">You</span>
                  </div>
                  <div>
                    <p className="font-semibold">{aboutYou.firstName} {aboutYou.lastName}</p>
                    <p className="text-xs text-muted-foreground">Full Story Post</p>
                  </div>
                </div>
                
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 border-2 border-accent/20">
                  <p className="text-base leading-relaxed whitespace-pre-line">{introCampaign.longPost.caption}</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground text-center mt-4">
                ✨ Copy, customize, and post when you're ready to launch
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Section */}
      <Card className="rounded-none border-x">
        <CardContent className="px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Start Your Journey</h2>
            <p className="text-muted-foreground">Choose what works best for you</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, idx) => (
              <Card key={idx} className="border-2 hover:border-primary/50 transition-colors group">
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-4">{product.type}</Badge>
                  <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-primary">{product.price}</span>
                  </div>
                  <Button className="w-full group-hover:scale-[1.02] transition-transform">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer Preview Label */}
      <div className="rounded-b-xl border-x border-b bg-muted/30 px-8 py-4 text-center">
        <Badge variant="outline" className="text-xs">
          ✨ Preview Mode • This is what customers will see when they visit your storefront
        </Badge>
      </div>
    </div>
  );
};

// Main export that switches based on flag
export const CustomerStorefront = (props: CustomerStorefrontProps) => {
  if (!FLAGS.SHOPFRONT_PREVIEW_V1) {
    return <LegacyCustomerStorefront {...props} />;
  }

  // Attempt to read any onboarding state/props available
  const onboardingState = {
    businessIdentity: props.businessIdentity,
    aboutYou: props.aboutYou,
    products: props.products,
    idea: props.idea,
    audience: props.audience,
    introCampaign: props.introCampaign,
  };

  const { business, settings, products } = adaptOnboardingToShopfront(onboardingState);

  return (
    <ShopfrontView
      business={{
        id: business.id,
        name: business.name,
        logoUrl: business.logoUrl ?? undefined,
        avatarUrl: business.avatarUrl ?? undefined,
        tagline: business.tagline ?? undefined,
        aboutShort: business.aboutShort ?? undefined,
        contactEmail: business.contactEmail ?? undefined,
      }}
      settings={settings}
      products={products}
      onQueryChange={() => {}}
      disableCart
    />
  );
};

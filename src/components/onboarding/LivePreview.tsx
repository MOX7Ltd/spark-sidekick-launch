import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, DollarSign, TrendingUp, Lock } from 'lucide-react';

interface LivePreviewProps {
  idea: string;
  aboutYou?: {
    firstName: string;
    expertise: string;
    style: string;
  };
  audience?: string;
  businessIdentity?: {
    name: string;
    logo: string;
    tagline?: string;
    bio?: string;
    colors?: string[];
    logoSVG?: string;
    nameOptions?: string[];
  };
}

interface BusinessPreview {
  storefront: {
    name: string;
    logo: string;
    tagline: string;
    bio: string;
    colors: string;
  };
  products: { title: string; type: string; price: string }[];
  introPost: {
    hook: string;
    caption: string;
    hashtags: string[];
  };
}

export const LivePreview = ({ idea, aboutYou, audience, businessIdentity }: LivePreviewProps) => {
  // Generate preview based on inputs
  const generatePreview = (): BusinessPreview => {
    const businessName = businessIdentity?.name || "Your Business";
    const firstName = aboutYou?.firstName || "Owner";
    const expertise = aboutYou?.expertise || "helping others succeed";
    const style = aboutYou?.style || "friendly";
    
    // Use AI-generated content if available, otherwise fallback to generated content
    const bio = businessIdentity?.bio || generateBio();
    const tagline = businessIdentity?.tagline || generateTagline();
    // Generate personalized bio fallback
    function generateBio() {
      const greeting = style === 'playful' ? `Hey there! I'm ${firstName} 👋` : 
                      style === 'professional' ? `Hi, I'm ${firstName}.` : 
                      `Hello! I'm ${firstName} 🙂`;
      
      const mission = audience ? 
        `I've been ${expertise.replace(/I've been |I have been |I'm |I am /gi, '')}, and now I help ${audience.replace('_', ' ')} achieve similar success.` :
        `I've been ${expertise.replace(/I've been |I have been |I'm |I am /gi, '')}, and I'm passionate about sharing what I've learned.`;
      
      return `${greeting} ${mission}`;
    }

    // Generate tagline fallback
    function generateTagline() {
      const audienceMap: { [key: string]: string } = {
        'busy_parents': 'making family life easier',
        'entrepreneurs': 'turning ideas into success',
        'learners': 'accelerating your growth',
        'other': 'transforming your approach'
      };
      
      return audienceMap[audience || 'other'] || 'helping you succeed';
    };

    // Generate products based on idea and audience
    const generateProducts = () => {
      const ideaLower = idea.toLowerCase();
      const isGuideIdea = ideaLower.includes('guide') || ideaLower.includes('course');
      const isCoachingIdea = ideaLower.includes('coaching') || ideaLower.includes('consulting');
      
      if (isGuideIdea) {
        return [
          { title: "Complete Starter Guide", type: "Digital Guide", price: "$47" },
          { title: "Quick Reference Templates", type: "Template Pack", price: "$27" }
        ];
      } else if (isCoachingIdea) {
        return [
          { title: "1:1 Strategy Session", type: "Consultation", price: "$149" },
          { title: "Group Coaching Program", type: "Course", price: "$297" }
        ];
      } else {
        return [
          { title: "Getting Started Blueprint", type: "Digital Guide", price: "$39" },
          { title: "Done-For-You Templates", type: "Template Pack", price: "$29" }
        ];
      }
    };

    // Generate intro post
    const generateIntroPost = () => {
      const hooks = {
        'busy_parents': "Being a parent is hard enough without...",
        'entrepreneurs': "Most entrepreneurs fail because they...",
        'learners': "The biggest learning mistake I see is...",
        'other': "Here's what nobody tells you about..."
      };
      
      const hook = hooks[audience as keyof typeof hooks] || hooks.other;
      
      const caption = `${generateBio()}\n\nI started ${businessName} because I noticed ${audience ? audience.replace('_', ' ') : 'people'} struggling with the same challenges I once faced.\n\nMy approach is simple: ${style === 'playful' ? 'make it fun and doable' : style === 'professional' ? 'proven strategies that work' : 'friendly support every step of the way'}.\n\nExcited to share this journey with you! 🚀`;
      
      return {
        hook,
        caption,
        hashtags: audience === 'busy_parents' ? ["#ParentLife", "#MomHacks", "#DadTips", "#FamilyFirst"] :
                 audience === 'entrepreneurs' ? ["#Entrepreneur", "#StartupLife", "#BusinessTips", "#Success"] :
                 audience === 'learners' ? ["#Learning", "#GrowthMindset", "#SkillBuilding", "#PersonalDevelopment"] :
                 ["#NewBusiness", "#Passion", "#Community", "#Growth"]
      };
    };

      return {
        storefront: {
          name: businessName,
          logo: businessIdentity?.logo || 'logo-0',
          tagline: tagline,
          bio: bio,
          colors: businessIdentity?.colors?.[0] ? `from-[${businessIdentity.colors[0]}] to-[${businessIdentity.colors[1] || businessIdentity.colors[0]}]` : 'from-brand-teal to-brand-orange'
        },
        products: generateProducts(),
        introPost: generateIntroPost()
      };
    };

    const preview = generatePreview();

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Storefront Preview */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header with Logo */}
            <div className={`bg-gradient-to-r ${preview.storefront.colors} p-6 text-white`}>
              <div className="flex items-center space-x-4">
                {businessIdentity?.logoSVG ? (
                  <div 
                    className="w-24 h-24 md:w-28 md:h-28 bg-white/20 rounded-full flex items-center justify-center overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: businessIdentity.logoSVG }}
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {preview.storefront.logo === 'logo-0' ? '🚀' : 
                     preview.storefront.logo === 'logo-1' ? '✨' : '💡'}
                    {preview.storefront.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">{preview.storefront.name}</h3>
                  <p className="text-white/90">{preview.storefront.tagline}</p>
                </div>
              </div>
            </div>
          
          {/* Bio */}
          <div className="p-6">
            <p className="text-lg leading-relaxed mb-4">{preview.storefront.bio}</p>
            <Badge variant="secondary" className="mb-4">Live Business Preview</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <DollarSign className="h-5 w-5 text-brand-orange" />
            <span>Your Products</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {preview.products.map((product, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-gradient-subtle">
                <h4 className="font-semibold text-lg">{product.title}</h4>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline">{product.type}</Badge>
                  <span className="font-bold text-xl text-brand-orange">{product.price}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intro Campaign */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <TrendingUp className="h-5 w-5 text-brand-teal" />
            <span>Your Intro Campaign</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border bg-background/50">
            <h5 className="text-sm font-semibold text-muted-foreground mb-2">HOOK</h5>
            <p className="font-semibold text-lg">{preview.introPost.hook}</p>
          </div>
          
          <div className="p-4 rounded-lg border bg-background/50">
            <h5 className="text-sm font-semibold text-muted-foreground mb-2">CAPTION</h5>
            <p className="leading-relaxed whitespace-pre-line">{preview.introPost.caption}</p>
          </div>
          
          <div className="p-4 rounded-lg border bg-background/50">
            <h5 className="text-sm font-semibold text-muted-foreground mb-2">HASHTAGS</h5>
            <div className="flex flex-wrap gap-2">
              {preview.introPost.hashtags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Ready to post • Created with SideHive</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
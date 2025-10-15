import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import sidehiveLogo from '@/assets/sidehive-logo.jpg';

/**
 * SiteHeader: Sticky global navigation
 * Always visible across all pages including onboarding
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo -> Home */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img 
            src={sidehiveLogo} 
            alt="SideHive" 
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-bold text-lg bg-gradient-hero bg-clip-text text-transparent">
            SideHive
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Home
          </NavLink>
          <a 
            href="/#features" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a 
            href="/#pricing" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </a>
          <a 
            href="/#guides" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Guides
          </a>
        </nav>

        {/* Auth / CTA */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            asChild
          >
            <Link to="/auth/signin">Sign In</Link>
          </Button>
          <Button 
            variant="hero" 
            size="sm"
            asChild
          >
            <Link to="/onboarding/final">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

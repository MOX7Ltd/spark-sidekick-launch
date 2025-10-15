import { Link } from 'react-router-dom';
import sidehiveLogo from '@/assets/sidehive-logo.jpg';

/**
 * SiteFooter: Clean, minimal footer
 * Sticky at bottom with essential links
 */
export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img 
              src={sidehiveLogo} 
              alt="SideHive" 
              className="h-5 w-5 rounded"
            />
            <span>© {currentYear} SideHive</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

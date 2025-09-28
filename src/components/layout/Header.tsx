import React from 'react';
import { Button } from '@/components/ui/button';
import sidehiveLogo from '@/assets/sidehive-logo.jpg';

export const Header = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={sidehiveLogo} 
            alt="SideHive Logo" 
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-bold text-xl bg-gradient-hero bg-clip-text text-transparent">
            SideHive
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
            Features
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
            Pricing
          </a>
          <a href="#guides" className="text-muted-foreground hover:text-foreground transition-smooth">
            Guides
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button variant="hero" size="sm">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};
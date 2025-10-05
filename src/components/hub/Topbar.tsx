import { useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');

  // Get user email
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user?.email) setUserEmail(user.email);
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="hidden sm:block text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">
            SideHive
          </h1>
        </div>

        {/* Right: Create + User Menu */}
        <div className="flex items-center gap-2">
          {/* Create dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="hero" size="default" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => console.log('Create Product')}>
                Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Create Campaign')}>
                Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(userEmail)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/hub/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

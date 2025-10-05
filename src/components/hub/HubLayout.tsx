import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { supabase } from '@/integrations/supabase/client';
import { claimOnboardingData } from '@/lib/onboardingStorage';
import { getBusinessIdentity } from '@/lib/db/identity';

export const HubLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Safety net: Attempt to claim onboarding data on first Hub visit if needed
  useEffect(() => {
    const attemptSafetyClaim = async () => {
      const pendingSession = localStorage.getItem('pending_claim_session');
      if (!pendingSession) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        // Check if user already has business identity
        const identity = await getBusinessIdentity(user.id);
        
        if (!identity) {
          // User has no identity but has pending session - attempt claim
          console.log('Safety net: Attempting to claim onboarding data');
          await claimOnboardingData(user.id);
        }
      } catch (e) {
        console.warn('Safety claim failed:', e);
      } finally {
        // Always remove the key to prevent loops
        localStorage.removeItem('pending_claim_session');
      }
    };

    attemptSafetyClaim();
  }, []);

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

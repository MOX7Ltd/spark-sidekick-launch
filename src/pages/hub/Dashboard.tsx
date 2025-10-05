import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { WelcomeModal } from '@/components/hub/WelcomeModal';
import { ProgressTracker } from '@/components/hub/ProgressTracker';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  User, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Star, 
  Megaphone,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    campaigns: 0,
    reviews: 0,
    messages: 0,
    events: 0,
  });
  const [businessName, setBusinessName] = useState('your business');
  const [progress, setProgress] = useState(0);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const [nextActions, setNextActions] = useState<Array<{ title: string; path: string }>>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has seen welcome modal
      const welcomeShown = localStorage.getItem('sidehive_welcome_shown');
      
      // Load business name and id
      const { data: business } = await supabase
        .from('businesses')
        .select('id, business_name')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (business?.business_name) {
        setBusinessName(business.business_name);
      }

      // Load stats in parallel
      const [productsRes, campaignsRes, reviewsRes, messagesRes, eventsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        business ? supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('business_id', business.id) : Promise.resolve({ count: 0 }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('message_threads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('calendar_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats({
        products: productsRes.count || 0,
        campaigns: campaignsRes.count || 0,
        reviews: reviewsRes.count || 0,
        messages: messagesRes.count || 0,
        events: eventsRes.count || 0,
      });

      // Show welcome modal for first-time users with data
      if (!welcomeShown && (productsRes.count || 0) > 0) {
        setShowWelcome(true);
        localStorage.setItem('sidehive_welcome_shown', 'true');
        
        // Log hub initialization event
        const sessionId = localStorage.getItem('sessionId') || 'unknown';
        await supabase.from('events').insert({
          session_id: sessionId,
          trace_id: `hub-init-${user.id}-${Date.now()}`,
          action: 'hub_initialized',
          step: 'dashboard',
          ok: true,
          payload_keys: ['products_count', 'campaigns_count'],
        });
      }

      // Calculate progress based on events
      await calculateProgress(user.id);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Failed to load dashboard",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = async (userId: string) => {
    try {
      // Get recent events
      const { data: events } = await supabase
        .from('events')
        .select('action')
        .order('created_at', { ascending: false })
        .limit(100);

      const actionSet = new Set(events?.map(e => e.action) || []);
      
      const milestones = [];
      let progressScore = 0;

      if (actionSet.has('onboarding_completed')) {
        milestones.push('Launched shopfront');
        progressScore += 20;
      }
      if (actionSet.has('launch_shared')) {
        milestones.push('Shared launch post');
        progressScore += 15;
      }
      if (stats.products > 0) {
        milestones.push(`Created ${stats.products} product${stats.products > 1 ? 's' : ''}`);
        progressScore += 20;
      }
      if (stats.campaigns > 0) {
        milestones.push('Generated marketing campaign');
        progressScore += 15;
      }
      if (actionSet.has('product_updated')) {
        milestones.push('Updated product details');
        progressScore += 10;
      }
      if (actionSet.has('profile_updated')) {
        milestones.push('Polished brand identity');
        progressScore += 10;
      }
      if (stats.messages > 0) {
        milestones.push('Received customer message');
        progressScore += 10;
      }

      setCompletedMilestones(milestones);
      setProgress(Math.min(progressScore, 100));

      // Calculate next actions
      const actions = [];
      if (!actionSet.has('launch_shared')) {
        actions.push({ title: '📢 Share your launch on social media', path: '/hub/dashboard' });
      }
      if (stats.campaigns === 0) {
        actions.push({ title: '🚀 Generate your first marketing campaign', path: '/hub/marketing' });
      }
      if (stats.products < 3) {
        actions.push({ title: '💡 Add more products to your catalog', path: '/hub/products' });
      }
      if (!actionSet.has('profile_updated')) {
        actions.push({ title: '✨ Polish your brand story', path: '/hub/profile' });
      }

      setNextActions(actions.slice(0, 3));

    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Products',
      description: '💡 Create something new',
      icon: Package,
      count: stats.products,
      path: '/hub/products',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Profile',
      description: '✨ Polish your story',
      icon: User,
      count: null,
      path: '/hub/profile',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Marketing',
      description: '🚀 Boost your reach',
      icon: Megaphone,
      count: stats.campaigns,
      path: '/hub/marketing',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Messages',
      description: '💬 Connect with customers',
      icon: MessageSquare,
      count: stats.messages,
      path: '/hub/messages',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Calendar',
      description: '📅 Schedule sessions',
      icon: CalendarIcon,
      count: stats.events,
      path: '/hub/calendar',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Reviews',
      description: '⭐ Build trust',
      icon: Star,
      count: stats.reviews,
      path: '/hub/reviews',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title={`Welcome back! 👋`}
        subtitle="Your command center for building and growing your business."
      />

      {/* Progress Tracker */}
      {completedMilestones.length > 0 && (
        <ProgressTracker
          progress={progress}
          completedMilestones={completedMilestones}
          nextActions={nextActions}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card
            key={action.path}
            className="group hover:shadow-xl transition-all cursor-pointer rounded-2xl"
            onClick={() => navigate(action.path)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-full ${action.bgColor}`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                {action.count !== null && (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {action.count}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">
                {action.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mb-4">
                {action.description}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="group-hover:bg-primary group-hover:text-white transition-colors w-full"
              >
                Open
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        businessName={businessName}
        stats={{ products: stats.products, campaigns: stats.campaigns }}
      />
    </div>
  );
}

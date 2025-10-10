import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReviewsTable } from '@/components/reviews/ReviewsTable';
import { useReviews } from '@/hooks/reviews/useReviews';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CustomersReviews() {
  if (!FLAGS.REVIEWS_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub/customers" label="Back to Customers" />
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Reviews</h1>
          <p className="text-muted-foreground">Reviews are currently disabled.</p>
        </div>
      </AppSurface>
    );
  }

  const { toast } = useToast();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view reviews.",
          variant: "destructive",
        });
        return;
      }
      const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
      setBusinessId(data?.id ?? null);
    })();
  }, [toast]);

  const published = useReviews(businessId ?? undefined, { status: 'published' });
  const pending = useReviews(businessId ?? undefined, { status: 'pending' });

  async function publish(id: string) {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'published' })
        .eq('id', id);

      if (error) throw error;

      // Recompute business rating
      if (businessId) {
        await supabase.rpc('compute_business_rating', { bid: businessId });
      }

      await Promise.all([published.refetch(), pending.refetch()]);
      toast({ title: "Review published" });
    } catch (error) {
      console.error('Failed to publish review:', error);
      toast({
        title: "Failed to publish review",
        variant: "destructive",
      });
    }
  }

  async function reject(id: string) {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_hidden: true, status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      await Promise.all([published.refetch(), pending.refetch()]);
      toast({ title: "Review rejected" });
    } catch (error) {
      console.error('Failed to reject review:', error);
      toast({
        title: "Failed to reject review",
        variant: "destructive",
      });
    }
  }

  async function reply(id: string, text: string) {
    try {
      const { error } = await supabase.functions.invoke('review-reply', {
        body: { reviewId: id, reply: text },
      });

      if (error) throw error;

      await published.refetch();
      toast({ title: "Reply posted" });
    } catch (error) {
      console.error('Failed to post reply:', error);
      toast({
        title: "Failed to post reply",
        variant: "destructive",
      });
      throw error;
    }
  }

  return (
    <AppSurface>
      <BackBar to="/hub/customers" label="Back to Customers" />
      <div className="mt-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Customer Reviews</h1>
        {!businessId ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading...
          </div>
        ) : (
          <Tabs defaultValue="published" className="max-w-screen-xl">
            <TabsList>
              <TabsTrigger value="published">
                Published ({published.data?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pending.data?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="published" className="mt-4">
              <ReviewsTable items={published.data ?? []} onReply={reply} />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <ReviewsTable 
                items={pending.data ?? []} 
                onPublish={publish} 
                onReject={reject} 
                onReply={reply} 
                showModeration 
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppSurface>
  );
}

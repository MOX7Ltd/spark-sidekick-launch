import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';

export function ReviewForm({
  open,
  onOpenChange,
  businessId,
  businessName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  businessName: string;
}) {
  if (!FLAGS.REVIEWS_V1) return null;

  const { toast } = useToast();
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit = rating > 0 && email.trim() && /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('new-review', {
        body: {
          businessId,
          rating: rating * 20, // Convert 1-5 to 0-100
          title: title.trim() || null,
          body: body.trim() || null,
          name: name.trim() || null,
          email: email.trim(),
        },
      });

      if (error) throw error;

      // Track review submission
      trackEvent('review_submit', { businessId });

      toast({
        title: "Review submitted!",
        description: "Please check your email to confirm your review.",
      });

      onOpenChange(false);
      
      // Reset form
      setRating(5);
      setTitle('');
      setBody('');
      setName('');
      setEmail('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({
        title: "Couldn't submit review",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a review for {businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl text-yellow-500 transition-colors hover:scale-110"
                >
                  {star <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Great experience!"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Review (optional)</label>
            <Textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell others about your experience..."
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Your name (optional)</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                maxLength={100}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

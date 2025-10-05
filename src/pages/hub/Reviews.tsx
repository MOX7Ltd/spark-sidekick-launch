import { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';
import { SkeletonCard } from '@/components/hub/SkeletonCard';
import { MicroGuidance } from '@/components/hub/MicroGuidance';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { listReviews, replyToReview, toggleHidden, deleteReview, type Review } from '@/lib/db/reviews';
import { format } from 'date-fns';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
    loadProducts();
  }, [productFilter, ratingFilter]);

  const loadReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await listReviews(user.id, {
        productId: productFilter !== 'all' ? productFilter : undefined,
        rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
        search: search || undefined
      });
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: "Failed to load reviews",
        description: "Could not load your reviews.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, title')
        .eq('user_id', user.id);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    try {
      await replyToReview(reviewId, replyText);
      await loadReviews();
      setReplyingTo(null);
      setReplyText('');
      toast({ title: "Reply saved", description: "Your reply has been added." });
    } catch (error) {
      console.error('Error replying to review:', error);
      toast({
        title: "Reply failed",
        description: "Could not save your reply.",
        variant: "destructive"
      });
    }
  };

  const handleToggleHidden = async (reviewId: string, isHidden: boolean) => {
    try {
      await toggleHidden(reviewId, !isHidden);
      await loadReviews();
      toast({
        title: isHidden ? "Review shown" : "Review hidden",
        description: isHidden ? "Review is now visible." : "Review is now hidden from shopfront."
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Update failed",
        description: "Could not update review visibility.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await deleteReview(reviewId);
      await loadReviews();
      toast({ title: "Review deleted", description: "The review has been removed." });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the review.",
        variant: "destructive"
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Reviews"
          subtitle="Manage customer feedback and build trust."
        />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reviews"
        subtitle="Manage customer feedback and build trust."
      />

      <MicroGuidance text="Customer feedback is gold — your first fans will be here soon! ⭐" />

      {reviews.length === 0 && productFilter === 'all' && ratingFilter === 'all' && !search ? (
        <EmptyState
          icon={Star}
          title="No customer feedback yet"
          description="Reviews will appear here once customers start sharing their experience with your products."
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search reviewer or comment..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                loadReviews();
              }}
              className="flex-1"
            />
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="5">5 ⭐</SelectItem>
                <SelectItem value="4">4 ⭐</SelectItem>
                <SelectItem value="3">3 ⭐</SelectItem>
                <SelectItem value="2">2 ⭐</SelectItem>
                <SelectItem value="1">1 ⭐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews table */}
          <div className="border rounded-2xl overflow-hidden shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No reviews match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <>
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">
                          {review.product?.title || 'Unknown'}
                        </TableCell>
                        <TableCell>{review.reviewer_name || 'Anonymous'}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="line-clamp-2 text-sm">{review.comment}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (replyingTo === review.id) {
                                  setReplyingTo(null);
                                } else {
                                  setReplyingTo(review.id);
                                  setReplyText(review.reply || '');
                                }
                              }}
                            >
                              Reply
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleHidden(review.id, review.is_hidden)}
                            >
                              {review.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(review.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {replyingTo === review.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <div className="space-y-2 py-2">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your reply..."
                                className="resize-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleReply(review.id)}
                                  disabled={!replyText.trim()}
                                >
                                  Save Reply
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

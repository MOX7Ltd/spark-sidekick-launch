import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  reviewer_name?: string;
  rating: number;
  comment?: string;
  reply?: string;
  created_at: string;
  is_hidden: boolean;
  product?: {
    title: string;
  };
}

export async function listReviews(
  userId: string,
  filters?: {
    productId?: string;
    rating?: number;
    search?: string;
  }
): Promise<Review[]> {
  let query = supabase
    .from('reviews')
    .select('*, products(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.productId) {
    query = query.eq('product_id', filters.productId);
  }
  if (filters?.rating) {
    query = query.eq('rating', filters.rating);
  }

  const { data, error } = await query;
  if (error) throw error;

  let results = data || [];

  // Client-side search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.reviewer_name?.toLowerCase().includes(searchLower) ||
        r.comment?.toLowerCase().includes(searchLower)
    );
  }

  return results;
}

export async function replyToReview(
  reviewId: string,
  reply: string
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ reply })
    .eq('id', reviewId);

  if (error) throw error;
}

export async function toggleHidden(
  reviewId: string,
  isHidden: boolean
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ is_hidden: isHidden })
    .eq('id', reviewId);

  if (error) throw error;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}

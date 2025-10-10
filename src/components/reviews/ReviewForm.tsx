import { FLAGS } from '@/lib/flags';

export default function ReviewForm() {
  if (!FLAGS.REVIEWS_V1) return null;
  
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Review form UI coming soon (Phase M2)
    </div>
  );
}

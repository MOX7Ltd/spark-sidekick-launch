import { FLAGS } from '@/lib/flags';

export default function ReviewReply() {
  if (!FLAGS.REVIEWS_V1) return null;
  
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Review reply UI coming soon (Phase M3)
    </div>
  );
}

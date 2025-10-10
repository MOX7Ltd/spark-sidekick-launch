import { FLAGS } from '@/lib/flags';

export default function MessagesList() {
  if (!FLAGS.MESSAGING_V1) return null;
  
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Messages list UI coming soon (Phase M3)
    </div>
  );
}

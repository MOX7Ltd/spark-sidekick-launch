import { FLAGS } from '@/lib/flags';

export default function MessageModal() {
  if (!FLAGS.MESSAGING_V1) return null;
  
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Messaging UI coming soon (Phase M2)
    </div>
  );
}

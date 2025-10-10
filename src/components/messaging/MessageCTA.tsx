import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export function MessageCTA({ onClick }: { onClick: () => void }) {
  if (!FLAGS.MESSAGING_V1) return null;
  return (
    <Button className="h-11 rounded-full" onClick={onClick}>
      <MessageSquare className="mr-2 h-4 w-4" /> Message seller
    </Button>
  );
}

import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function MessageModal({
  open, onOpenChange, businessName, productName, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessName: string;
  productName?: string | null;
  onSubmit?: (payload: { name: string; email: string; topic: string; body: string }) => void;
}) {
  if (!FLAGS.MESSAGING_V1) return null;

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [topic, setTopic] = React.useState('general');
  const [body, setBody] = React.useState(productName ? `Question about "${productName}":\n` : '');

  const canSend = name.trim() && /\S+@\S+\.\S+/.test(email) && body.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Your name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Topic</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="general">General</option>
              <option value="shipping">Shipping</option>
              <option value="booking">Booking</option>
              <option value="pricing">Pricing</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Message</label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="How does delivery work?" />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!canSend}
            onClick={() => {
              onSubmit?.({ name, email, topic, body });
              onOpenChange(false);
            }}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

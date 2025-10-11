import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, Clock, Mail, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  title: string | null;
  customer_name: string | null;
  customer_email: string | null;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  appt: Appointment | null;
  onStatus: (status: string) => Promise<void>;
}

export function AppointmentModal({ open, onClose, appt, onStatus }: AppointmentModalProps) {
  const [updating, setUpdating] = React.useState(false);

  if (!appt) return null;

  const handleStatus = async (status: string) => {
    setUpdating(true);
    try {
      await onStatus(status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {appt.title || 'Appointment Details'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">{format(new Date(appt.start_time), 'PPPP')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-muted-foreground">
                  {format(new Date(appt.start_time), 'p')} – {format(new Date(appt.end_time), 'p')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Customer</p>
                <p className="text-muted-foreground">{appt.customer_name || 'No name provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{appt.customer_email || 'No email provided'}</p>
              </div>
            </div>

            {appt.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{appt.notes}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'h-5 w-5 rounded-full mt-0.5',
                  appt.status === 'confirmed' && 'bg-green-500',
                  appt.status === 'pending' && 'bg-yellow-500',
                  appt.status === 'cancelled' && 'bg-red-500'
                )}
              />
              <div>
                <p className="font-medium">Status</p>
                <p className="text-muted-foreground capitalize">{appt.status}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            {appt.status !== 'confirmed' && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => handleStatus('confirmed')}
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            )}
            {appt.status !== 'cancelled' && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleStatus('cancelled')}
                disabled={updating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

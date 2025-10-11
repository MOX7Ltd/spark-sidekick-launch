import * as React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar, Clock, Mail, User } from 'lucide-react';
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

interface CalendarViewProps {
  appointments: Appointment[];
  onSelect: (id: string) => void;
}

export function CalendarView({ appointments, onSelect }: CalendarViewProps) {
  if (appointments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No appointments scheduled</p>
        <p className="text-sm text-muted-foreground mt-2">
          Appointments will appear here when customers book time with you
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {appointments.map((a) => (
        <Card
          key={a.id}
          className="p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary"
          onClick={() => onSelect(a.id)}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-base line-clamp-1">
                {a.title || 'Appointment'}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                  a.status === 'confirmed' && 'bg-green-100 text-green-800',
                  a.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                  a.status === 'cancelled' && 'bg-red-100 text-red-800'
                )}
              >
                {a.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(a.start_time), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(a.start_time), 'p')} – {format(new Date(a.end_time), 'p')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="line-clamp-1">{a.customer_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="line-clamp-1">{a.customer_email || 'No email'}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

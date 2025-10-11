import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { CalendarView } from '@/components/calendar/CalendarView';
import { AppointmentModal } from '@/components/calendar/AppointmentModal';
import { useAppointments } from '@/hooks/calendar/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CustomersCalendar() {
  const { toast } = useToast();

  if (!FLAGS.CALENDAR_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub/customers" label="Back to Customers" />
        <div className="p-6 text-sm text-muted-foreground">
          Calendar feature is not yet enabled.
        </div>
      </AppSurface>
    );
  }

  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<any>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not signed in',
          description: 'Please sign in to view appointments',
          variant: 'destructive',
        });
        return;
      }
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      setBusinessId(data?.id ?? null);
    })();
  }, [toast]);

  const { data: appts = [], refetch } = useAppointments(businessId ?? undefined);

  async function updateStatus(status: string) {
    if (!selected) return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', selected.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Appointment ${status}`,
      });

      await refetch();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update appointment',
        variant: 'destructive',
      });
    }
  }

  if (!businessId) {
    return (
      <AppSurface>
        <BackBar to="/hub/customers" label="Back to Customers" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <BackBar to="/hub/customers" label="Back to Customers" />
      <div className="mx-auto mt-6 max-w-screen-xl p-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar & Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your scheduled appointments with customers
          </p>
        </div>

        <CalendarView
          appointments={appts}
          onSelect={(id) => {
            const appointment = appts.find((a) => a.id === id);
            setSelected(appointment);
            setOpen(true);
          }}
        />

        <AppointmentModal
          open={open}
          onClose={() => setOpen(false)}
          appt={selected}
          onStatus={updateStatus}
        />
      </div>
    </AppSurface>
  );
}

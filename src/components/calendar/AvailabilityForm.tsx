import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityForm({ 
  businessId, 
  onSaved 
}: { 
  businessId: string; 
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState([
    { weekday: 1, start_time: '09:00', end_time: '17:00' }
  ]);

  async function save() {
    try {
      // Delete existing availability for this business
      await supabase
        .from('availability')
        .delete()
        .eq('business_id', businessId);

      // Insert new availability
      const { error } = await supabase
        .from('availability')
        .insert(rows.map((r) => ({ ...r, business_id: businessId })));

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Availability saved successfully',
      });

      onSaved?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save availability',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">Set Weekly Availability</h3>
      {rows.map((r, idx) => (
        <div key={idx} className="flex gap-2 text-sm items-center">
          <select
            value={r.weekday}
            onChange={(e) => {
              const next = [...rows];
              next[idx].weekday = Number(e.target.value);
              setRows(next);
            }}
            className="border rounded-md p-2 bg-background"
          >
            {WEEKDAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
          <Input
            type="time"
            value={r.start_time}
            onChange={(e) => {
              const next = [...rows];
              next[idx].start_time = e.target.value;
              setRows(next);
            }}
            className="w-32"
          />
          <Input
            type="time"
            value={r.end_time}
            onChange={(e) => {
              const next = [...rows];
              next[idx].end_time = e.target.value;
              setRows(next);
            }}
            className="w-32"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRows(rows.filter((_, i) => i !== idx))}
          >
            ✕
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setRows([
              ...rows,
              { weekday: 1, start_time: '09:00', end_time: '17:00' },
            ])
          }
        >
          Add Slot
        </Button>
        <Button size="sm" onClick={save}>
          Save Availability
        </Button>
      </div>
    </Card>
  );
}

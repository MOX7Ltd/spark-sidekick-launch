import * as React from 'react';
import { format, addDays, eachHourOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

export function FullCalendarView({ 
  weekStart, 
  appointments, 
  availability, 
  onSelect 
}: { 
  weekStart: Date; 
  appointments: any[]; 
  availability: any[]; 
  onSelect: (id: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hours = eachHourOfInterval({
    start: new Date(2024, 0, 1, 6, 0),
    end: new Date(2024, 0, 1, 22, 0),
  });

  function findAppointments(day: Date, hour: number) {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);
    return appointments.filter(
      (a) =>
        new Date(a.start_time) < end &&
        new Date(a.end_time) > start &&
        a.status !== 'cancelled'
    );
  }

  function isAvailable(day: Date, hour: number) {
    return availability.some(
      (av: any) =>
        av.weekday === day.getDay() &&
        hour >= Number(av.start_time.split(':')[0]) &&
        hour < Number(av.end_time.split(':')[0])
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <div className="grid grid-cols-[4rem_repeat(7,minmax(80px,1fr))] min-w-[600px]">
        <div className="bg-muted text-xs p-2"></div>
        {days.map((d) => (
          <div 
            key={d.toISOString()} 
            className="p-2 text-center text-xs font-medium border-b"
          >
            {format(d, 'EEE dd')}
          </div>
        ))}

        {hours.map((h, idx) => (
          <React.Fragment key={idx}>
            <div className="border-t border-r p-1 text-xs text-muted-foreground bg-muted/50">
              {format(h, 'ha')}
            </div>
            {days.map((d) => {
              const appts = findAppointments(d, h.getHours());
              const available = isAvailable(d, h.getHours());
              return (
                <div
                  key={d.toISOString() + idx}
                  className={cn(
                    'border-t border-r h-14 relative cursor-pointer transition-colors',
                    available && appts.length === 0 && 'bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30',
                    !available && 'bg-muted/10',
                    appts.length > 0 && 'bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-950/60'
                  )}
                  onClick={() => appts[0] && onSelect(appts[0].id)}
                >
                  {appts.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-red-700 dark:text-red-300 p-1 text-center">
                      {appts[0].title || 'Booked'}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

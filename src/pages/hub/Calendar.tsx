import { Calendar as CalendarIcon } from 'lucide-react';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';

export default function Calendar() {
  return (
    <div>
      <SectionHeader
        title="Calendar"
        subtitle="Plan sessions, workshops, and classes."
      />

      <EmptyState
        icon={CalendarIcon}
        title="No events scheduled"
        description="Create your first event to start scheduling with customers."
      />
    </div>
  );
}

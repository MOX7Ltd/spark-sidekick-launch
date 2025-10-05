import { Star } from 'lucide-react';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';

export default function Reviews() {
  return (
    <div>
      <SectionHeader
        title="Reviews"
        subtitle="See what customers say and respond."
      />

      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="Customer reviews will appear here as they come in."
      />
    </div>
  );
}

import { Plus, Megaphone } from 'lucide-react';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';

export default function Marketing() {
  return (
    <div>
      <SectionHeader
        title="Marketing"
        subtitle="Generate posts that help you sell."
        primaryAction={{
          label: 'New Campaign',
          icon: Plus,
          onClick: () => console.log('New campaign'),
        }}
      />

      <EmptyState
        icon={Megaphone}
        title="No campaigns yet"
        description="Create your first marketing campaign to reach customers."
      />
    </div>
  );
}

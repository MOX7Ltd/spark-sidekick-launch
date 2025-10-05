import { MessageSquare } from 'lucide-react';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';

export default function Messages() {
  return (
    <div>
      <SectionHeader
        title="Messages"
        subtitle="Reply to customers in one place."
      />

      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Customer messages will appear here when they reach out."
      />
    </div>
  );
}

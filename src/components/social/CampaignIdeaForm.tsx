import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CampaignGoal, CampaignAngle, DurationPreset, DURATION_PRESETS } from '@/lib/socialLab';
import { cn } from '@/lib/utils';

interface CampaignIdeaFormProps {
  onGenerate: (data: {
    idea: string;
    goal: CampaignGoal;
    angle: CampaignAngle[];
    duration: DurationPreset;
    audienceHints: string[];
  }) => void;
  audienceHints?: string[];
  onCancel: () => void;
}

const GOALS: { value: CampaignGoal; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'signups', label: 'Sign-ups' },
  { value: 'sales', label: 'Product sales' },
  { value: 'bookings', label: 'Bookings' }
];

const ANGLES: { value: CampaignAngle; label: string }[] = [
  { value: 'educational', label: 'Educational' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'behind-the-scenes', label: 'Behind the scenes' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'offer', label: 'Offer' }
];

export function CampaignIdeaForm({ onGenerate, audienceHints = [], onCancel }: CampaignIdeaFormProps) {
  const [idea, setIdea] = useState('');
  const [goal, setGoal] = useState<CampaignGoal>('awareness');
  const [angles, setAngles] = useState<CampaignAngle[]>(['educational']);
  const [duration, setDuration] = useState<DurationPreset>('7d');

  const toggleAngle = (angle: CampaignAngle) => {
    if (angles.includes(angle)) {
      setAngles(angles.filter(a => a !== angle));
    } else {
      setAngles([...angles, angle]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    onGenerate({ idea, goal, angle: angles, duration, audienceHints });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-background/60 backdrop-blur-md border rounded-lg p-6">
      <div>
        <Label htmlFor="idea">Campaign focus</Label>
        <Input
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="30-day ball mastery challenge"
          className="mt-2"
        />
      </div>

      <div>
        <Label>Goal</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {GOALS.map(({ value, label }) => (
            <Badge
              key={value}
              variant={goal === value ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all min-h-[44px] px-4",
                goal === value && "bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-0"
              )}
              onClick={() => setGoal(value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Angle (select multiple)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {ANGLES.map(({ value, label }) => (
            <Badge
              key={value}
              variant={angles.includes(value) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all min-h-[44px] px-4",
                angles.includes(value) && "bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-0"
              )}
              onClick={() => toggleAngle(value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Duration & Cadence</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {(Object.keys(DURATION_PRESETS) as DurationPreset[]).map((key) => {
            const preset = DURATION_PRESETS[key];
            return (
              <Badge
                key={key}
                variant={duration === key ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer transition-all min-h-[44px] px-4",
                  duration === key && "bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-0"
                )}
                onClick={() => setDuration(key)}
              >
                {preset.label} ({preset.posts[0]}–{preset.posts[1]} posts)
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!idea.trim()}
          className="flex-1 bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:opacity-90"
        >
          Generate campaign concepts
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

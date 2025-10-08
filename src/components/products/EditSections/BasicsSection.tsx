import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCT_FAMILIES } from '@/lib/productLab';

interface BasicsSectionProps {
  title: string;
  description: string;
  family: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFamilyChange: (value: string) => void;
}

export function BasicsSection({
  title,
  description,
  family,
  onTitleChange,
  onDescriptionChange,
  onFamilyChange,
}: BasicsSectionProps) {
  const helperPrompts = [
    'What will customers achieve?',
    'What makes this different?',
    'Who is this for?',
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Product Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., 6-Week Striker Skills Plan"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Tell customers what they'll get and why it matters..."
          rows={5}
          className="mt-1"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {helperPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="text-xs px-2 py-1 bg-white/50 border border-white/30 rounded-full hover:bg-white/70 transition-colors"
              onClick={() => {
                if (description) {
                  onDescriptionChange(`${description}\n\n${prompt}`);
                } else {
                  onDescriptionChange(prompt);
                }
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Product Type</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRODUCT_FAMILIES.map((fam) => (
            <button
              key={fam.key}
              type="button"
              onClick={() => onFamilyChange(fam.key)}
              className={`text-sm px-3 py-2 rounded-lg border transition-all ${
                family === fam.key
                  ? 'bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-transparent'
                  : 'bg-white/50 border-white/30 hover:bg-white/70'
              }`}
            >
              {fam.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

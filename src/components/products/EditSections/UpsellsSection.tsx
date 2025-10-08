import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface UpsellsSectionProps {
  availableProducts: Array<{ id: string; title: string }>;
  selectedUpsells: string[];
  onUpsellsChange: (upsells: string[]) => void;
}

export function UpsellsSection({
  availableProducts,
  selectedUpsells,
  onUpsellsChange,
}: UpsellsSectionProps) {
  const toggleUpsell = (id: string) => {
    if (selectedUpsells.includes(id)) {
      onUpsellsChange(selectedUpsells.filter((u) => u !== id));
    } else {
      onUpsellsChange([...selectedUpsells, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Related Products (Upsells)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Select products to show as related offers
        </p>
      </div>

      {availableProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No other products available yet.</p>
      ) : (
        <div className="space-y-2">
          {availableProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 bg-white/50 border border-white/30 rounded-lg"
            >
              <Checkbox
                id={`upsell-${product.id}`}
                checked={selectedUpsells.includes(product.id)}
                onCheckedChange={() => toggleUpsell(product.id)}
              />
              <Label htmlFor={`upsell-${product.id}`} className="flex-1 cursor-pointer">
                {product.title}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

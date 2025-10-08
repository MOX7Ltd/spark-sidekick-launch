import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type PriceModel, type PriceTier } from '@/lib/products';

interface PricingSectionProps {
  priceModel: PriceModel;
  price: number;
  priceHigh?: number;
  monthlyPrice?: number;
  tiers?: PriceTier[];
  onPriceModelChange: (model: PriceModel) => void;
  onPriceChange: (price: number, high?: number) => void;
  onMonthlyPriceChange: (price: number) => void;
  onTiersChange: (tiers: PriceTier[]) => void;
}

export function PricingSection({
  priceModel,
  price,
  priceHigh,
  monthlyPrice,
  tiers = [],
  onPriceModelChange,
  onPriceChange,
  onMonthlyPriceChange,
  onTiersChange,
}: PricingSectionProps) {
  const models: Array<{ value: PriceModel; label: string }> = [
    { value: 'one-off', label: 'One-off' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'tiered', label: 'Tiered' },
  ];

  const handleTierChange = (index: number, field: keyof PriceTier, value: string | number) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onTiersChange(updated);
  };

  const addTier = () => {
    if (tiers.length < 3) {
      onTiersChange([...tiers, { name: '', price: 0 }]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Pricing Model</Label>
        <div className="mt-2 flex gap-2">
          {models.map((model) => (
            <button
              key={model.value}
              type="button"
              onClick={() => onPriceModelChange(model.value)}
              className={`flex-1 text-sm px-3 py-2 rounded-lg border transition-all ${
                priceModel === model.value
                  ? 'bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-transparent'
                  : 'bg-white/50 border-white/30 hover:bg-white/70'
              }`}
            >
              {model.label}
            </button>
          ))}
        </div>
      </div>

      {priceModel === 'one-off' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="price-low">Price (£) *</Label>
            <Input
              id="price-low"
              type="number"
              value={price || ''}
              onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0, priceHigh)}
              placeholder="19"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="price-high">High (optional)</Label>
            <Input
              id="price-high"
              type="number"
              value={priceHigh || ''}
              onChange={(e) => onPriceChange(price, parseFloat(e.target.value) || undefined)}
              placeholder="49"
              className="mt-1"
            />
          </div>
        </div>
      )}

      {priceModel === 'subscription' && (
        <div>
          <Label htmlFor="monthly-price">Monthly Price (£) *</Label>
          <Input
            id="monthly-price"
            type="number"
            value={monthlyPrice || ''}
            onChange={(e) => onMonthlyPriceChange(parseFloat(e.target.value) || 0)}
            placeholder="29"
            className="mt-1"
          />
        </div>
      )}

      {priceModel === 'tiered' && (
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-white/50 border border-white/30 rounded-lg">
              <div>
                <Label htmlFor={`tier-name-${index}`}>Tier Name</Label>
                <Input
                  id={`tier-name-${index}`}
                  value={tier.name}
                  onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                  placeholder="Basic"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`tier-price-${index}`}>Price (£)</Label>
                <Input
                  id={`tier-price-${index}`}
                  type="number"
                  value={tier.price || ''}
                  onChange={(e) => handleTierChange(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="29"
                  className="mt-1"
                />
              </div>
            </div>
          ))}
          {tiers.length < 3 && (
            <button
              type="button"
              onClick={addTier}
              className="text-sm px-3 py-2 bg-white/50 border border-white/30 rounded-lg hover:bg-white/70 transition-colors w-full"
            >
              + Add Tier
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Price with confidence—start premium.
      </p>
    </div>
  );
}

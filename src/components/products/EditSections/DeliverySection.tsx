import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { FileUploader } from '@/components/upload/FileUploader';
import { type DeliveryMode } from '@/lib/products';

interface DeliverySectionProps {
  userId: string;
  productId: string;
  deliveryMode: DeliveryMode;
  files?: Array<{ url: string; name: string; size: number }>;
  bookingLink?: string;
  bookingDuration?: number;
  bookingCapacity?: number;
  bookingLocation?: string;
  availabilityNote?: string;
  shippingNote?: string;
  postPurchaseNote?: string;
  onDeliveryModeChange: (mode: DeliveryMode) => void;
  onFilesChange: (files: Array<{ url: string; name: string; size: number }>) => void;
  onBookingChange: (field: string, value: string | number) => void;
  onShippingNoteChange: (note: string) => void;
  onPostPurchaseNoteChange: (note: string) => void;
}

export function DeliverySection({
  userId,
  productId,
  deliveryMode,
  files,
  bookingLink,
  bookingDuration,
  bookingCapacity,
  bookingLocation,
  availabilityNote,
  shippingNote,
  postPurchaseNote,
  onDeliveryModeChange,
  onFilesChange,
  onBookingChange,
  onShippingNoteChange,
  onPostPurchaseNoteChange,
}: DeliverySectionProps) {
  const modes: Array<{ value: DeliveryMode; label: string }> = [
    { value: 'digital', label: 'Digital Download' },
    { value: 'service', label: 'Service / Session' },
    { value: 'physical', label: 'Physical Item' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label>Delivery Method</Label>
        <div className="mt-2 flex gap-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => onDeliveryModeChange(mode.value)}
              className={`flex-1 text-sm px-3 py-2 rounded-lg border transition-all ${
                deliveryMode === mode.value
                  ? 'bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-transparent'
                  : 'bg-white/50 border-white/30 hover:bg-white/70'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {deliveryMode === 'digital' && (
        <>
          <FileUploader
            userId={userId}
            productId={productId}
            existingFiles={files}
            onFilesChange={onFilesChange}
          />
          <div>
            <Label htmlFor="post-purchase-note">Post-Purchase Note (optional)</Label>
            <Textarea
              id="post-purchase-note"
              value={postPurchaseNote || ''}
              onChange={(e) => onPostPurchaseNoteChange(e.target.value)}
              placeholder="Instructions or welcome message after purchase..."
              rows={3}
              className="mt-1"
            />
          </div>
        </>
      )}

      {deliveryMode === 'service' && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Use your Zoom/Meet link—we'll handle bookings & reminders later.
            </AlertDescription>
          </Alert>
          <div>
            <Label htmlFor="booking-link">External Link (Zoom/Meet/Calendar) *</Label>
            <Input
              id="booking-link"
              value={bookingLink || ''}
              onChange={(e) => onBookingChange('external_link', e.target.value)}
              placeholder="https://zoom.us/j/..."
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input
                id="duration"
                type="number"
                value={bookingDuration || ''}
                onChange={(e) => onBookingChange('duration_mins', parseInt(e.target.value) || 0)}
                placeholder="60"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={bookingCapacity || ''}
                onChange={(e) => onBookingChange('capacity', parseInt(e.target.value) || 0)}
                placeholder="10"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location / Platform</Label>
            <Input
              id="location"
              value={bookingLocation || ''}
              onChange={(e) => onBookingChange('location', e.target.value)}
              placeholder="Zoom / Google Meet / In-person"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="availability">Availability Note</Label>
            <Textarea
              id="availability"
              value={availabilityNote || ''}
              onChange={(e) => onBookingChange('availability_note', e.target.value)}
              placeholder="Weekdays 9am–5pm GMT, book 24h ahead..."
              rows={2}
              className="mt-1"
            />
          </div>
        </>
      )}

      {deliveryMode === 'physical' && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Shipping happens via Messages between you and the buyer.
            </AlertDescription>
          </Alert>
          <div>
            <Label htmlFor="shipping-note">Shipping Note (shown on shopfront)</Label>
            <Textarea
              id="shipping-note"
              value={shippingNote || ''}
              onChange={(e) => onShippingNoteChange(e.target.value)}
              placeholder="UK shipping £5, international £12. Usually ships within 2 days."
              rows={3}
              className="mt-1"
            />
          </div>
        </>
      )}
    </div>
  );
}

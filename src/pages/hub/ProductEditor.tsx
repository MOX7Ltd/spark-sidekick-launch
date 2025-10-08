import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logFrontendEvent } from '@/lib/frontendEventLogger';
import { BasicsSection } from '@/components/products/EditSections/BasicsSection';
import { PricingSection } from '@/components/products/EditSections/PricingSection';
import { DeliverySection } from '@/components/products/EditSections/DeliverySection';
import { VisibilitySection } from '@/components/products/EditSections/VisibilitySection';
import { LinksSection } from '@/components/products/EditSections/LinksSection';
import { UpsellsSection } from '@/components/products/EditSections/UpsellsSection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { type ProductStatus, type PriceModel, type DeliveryMode, type ProductFulfillment } from '@/lib/products';

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  // Product fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [family, setFamily] = useState('guide');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [priceModel, setPriceModel] = useState<PriceModel>('one-off');
  const [price, setPrice] = useState(0);
  const [priceHigh, setPriceHigh] = useState<number | undefined>();
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [tiers, setTiers] = useState<Array<{ name: string; price: number }>>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('digital');
  const [files, setFiles] = useState<Array<{ url: string; name: string; size: number }>>([]);
  const [bookingLink, setBookingLink] = useState('');
  const [bookingDuration, setBookingDuration] = useState<number>();
  const [bookingCapacity, setBookingCapacity] = useState<number>();
  const [bookingLocation, setBookingLocation] = useState('');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  const [postPurchaseNote, setPostPurchaseNote] = useState('');
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [upsells, setUpsells] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    logFrontendEvent({
      eventType: 'step_transition',
      step: 'product_editor',
      payload: { product_id: id },
    });
    loadProduct();
    loadAvailableProducts();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setTitle(data.title || '');
      setDescription(data.description || '');
      setFamily(data.format || 'guide');
      setStatus((data.status as ProductStatus) || 'draft');
      setPrice(data.price || 0);

      const fulfillment = (data.fulfillment as ProductFulfillment) || {};
      setPriceModel(fulfillment.price_model || 'one-off');
      setPriceHigh(fulfillment.price_high);
      setMonthlyPrice(fulfillment.monthly_price || 0);
      setTiers(fulfillment.tiers || []);
      setDeliveryMode(fulfillment.delivery_mode || 'digital');
      setFiles(fulfillment.files || []);
      setBookingLink(fulfillment.booking?.external_link || '');
      setBookingDuration(fulfillment.booking?.duration_mins);
      setBookingCapacity(fulfillment.booking?.capacity);
      setBookingLocation(fulfillment.booking?.location || '');
      setAvailabilityNote(fulfillment.booking?.availability_note || '');
      setShippingNote(fulfillment.shipping_note || '');
      setPostPurchaseNote(fulfillment.post_purchase_note || '');
      setLinks(fulfillment.links || []);
      setCollections(fulfillment.collections || []);
      setFeatured(fulfillment.featured || false);
      setUpsells(fulfillment.upsells || []);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, title')
        .eq('user_id', user.id)
        .neq('id', id || '');

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error loading available products:', error);
    }
  };

  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      toast.error('Product title is required');
      return;
    }

    setSaving(true);
    try {
      const finalStatus = publish ? 'live' : status;

      const fulfillment: ProductFulfillment = {
        price_model: priceModel,
        price_high: priceHigh,
        monthly_price: monthlyPrice,
        tiers,
        delivery_mode: deliveryMode,
        files,
        booking: {
          external_link: bookingLink,
          duration_mins: bookingDuration,
          capacity: bookingCapacity,
          location: bookingLocation,
          availability_note: availabilityNote,
        },
        links,
        collections,
        featured,
        upsells,
        shipping_note: shippingNote,
        post_purchase_note: postPurchaseNote,
      };

      const { error } = await supabase
        .from('products')
        .update({
          title,
          description,
          format: family,
          status: finalStatus,
          price,
          fulfillment: fulfillment as any,
        })
        .eq('id', id);

      if (error) throw error;

      logFrontendEvent({
        eventType: 'user_action',
        step: publish ? 'publish_product' : 'save_product',
        payload: { product_id: id, status: finalStatus },
      });

      toast.success(publish ? 'Live! Your offer is now visible.' : 'Product saved');
      navigate(`/hub/products/manage?new=${id}`);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleBookingChange = (field: string, value: string | number) => {
    switch (field) {
      case 'external_link':
        setBookingLink(value as string);
        break;
      case 'duration_mins':
        setBookingDuration(value as number);
        break;
      case 'capacity':
        setBookingCapacity(value as number);
        break;
      case 'location':
        setBookingLocation(value as string);
        break;
      case 'availability_note':
        setAvailabilityNote(value as string);
        break;
    }
  };

  if (loading) {
    return (
      <AppSurface>
        <BackBar to="/hub/products/manage" label="Back to Products" />
        <p className="text-center text-muted-foreground mt-8">Loading product...</p>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <BackBar to="/hub/products/manage" label="Back to Products" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>

        <Accordion type="multiple" defaultValue={['basics', 'pricing', 'delivery']} className="space-y-3">
          <AccordionItem value="basics" className="backdrop-blur-md bg-white/75 border border-white/30 rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold">Basics</AccordionTrigger>
            <AccordionContent className="pt-3">
              <BasicsSection
                title={title}
                description={description}
                family={family}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onFamilyChange={setFamily}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pricing" className="backdrop-blur-md bg-white/75 border border-white/30 rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold">Pricing</AccordionTrigger>
            <AccordionContent className="pt-3">
              <PricingSection
                priceModel={priceModel}
                price={price}
                priceHigh={priceHigh}
                monthlyPrice={monthlyPrice}
                tiers={tiers}
                onPriceModelChange={setPriceModel}
                onPriceChange={(p, h) => {
                  setPrice(p);
                  setPriceHigh(h);
                }}
                onMonthlyPriceChange={setMonthlyPrice}
                onTiersChange={setTiers}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="delivery" className="backdrop-blur-md bg-white/75 border border-white/30 rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold">Delivery</AccordionTrigger>
            <AccordionContent className="pt-3">
              <DeliverySection
                userId={userId}
                productId={id || ''}
                deliveryMode={deliveryMode}
                files={files}
                bookingLink={bookingLink}
                bookingDuration={bookingDuration}
                bookingCapacity={bookingCapacity}
                bookingLocation={bookingLocation}
                availabilityNote={availabilityNote}
                shippingNote={shippingNote}
                postPurchaseNote={postPurchaseNote}
                onDeliveryModeChange={setDeliveryMode}
                onFilesChange={setFiles}
                onBookingChange={handleBookingChange}
                onShippingNoteChange={setShippingNote}
                onPostPurchaseNoteChange={setPostPurchaseNote}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="links" className="backdrop-blur-md bg-white/75 border border-white/30 rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold">External Links</AccordionTrigger>
            <AccordionContent className="pt-3">
              <LinksSection links={links} onLinksChange={setLinks} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="visibility" className="backdrop-blur-md bg-white/75 border border-white/30 rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold">Visibility</AccordionTrigger>
            <AccordionContent className="pt-3">
              <VisibilitySection
                status={status}
                featured={featured}
                collections={collections}
                onStatusChange={setStatus}
                onFeaturedChange={setFeatured}
                onCollectionsChange={setCollections}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="upsells" className="backdrop-blur-md bg-white/75 border border-white/30 rounded-xl px-4">
            <AccordionTrigger className="text-lg font-semibold">Upsells</AccordionTrigger>
            <AccordionContent className="pt-3">
              <UpsellsSection
                availableProducts={availableProducts}
                selectedUpsells={upsells}
                onUpsellsChange={setUpsells}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-white/30 p-4 safe-area-inset-bottom">
        <div className="mx-auto max-w-screen-sm flex gap-3">
          <Button
            variant="ghost"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white hover:opacity-90"
          >
            {saving ? 'Saving...' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      {/* Bottom padding to prevent content overlap with sticky bar */}
      <div className="h-20" />
    </AppSurface>
  );
}

import * as React from 'react';
import { FLAGS } from '@/lib/flags';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShopfrontView } from '@/components/shopfront/ShopfrontView';
import { getSettings, saveDraft, publishDraft } from '@/lib/shopfront/settingsApi';
import { supabase } from '@/integrations/supabase/client';

type Biz = {
  id: string;
  name: string;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  tagline?: string | null;
  aboutShort?: string | null;
};

type ProductView = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: string;
  imageUrl?: string | null;
};

export default function ProfileShopfront() {
  if (!FLAGS.SHOPFRONT_V1) {
    return (
      <AppSurface>
        <BackBar to="/hub/profile" label="Back to Profile" />
        <div className="mt-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground">Shopfront</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      </AppSurface>
    );
  }

  return <OwnerShopfrontInner />;
}

function OwnerShopfrontInner() {
  // UI tab
  const [tab, setTab] = React.useState<'customer' | 'edit'>('edit');

  // Business + products
  const [loadingBiz, setLoadingBiz] = React.useState(true);
  const [business, setBusiness] = React.useState<Biz | null>(null);
  const [products, setProducts] = React.useState<ProductView[]>([]);
  const [bizError, setBizError] = React.useState<string | null>(null);

  // Settings
  const [loadingSettings, setLoadingSettings] = React.useState(true);
  const [themeDraft, setThemeDraft] = React.useState<{ primary?: string; accent?: string; radius?: 'sm'|'md'|'xl'; density?: 'cozy'|'comfy'|'spacious' }>({});
  const [layoutDraft, setLayoutDraft] = React.useState<{ columns?: number }>({ columns: 3 });
  const [showAnnDraft, setShowAnnDraft] = React.useState(false);
  const [annTextDraft, setAnnTextDraft] = React.useState<string>('');
  const [publishedSettings, setPublishedSettings] = React.useState<any | null>(null);

  // Load owner business
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingBiz(true);
      setBizError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not signed in');

        // Load the owner business
        const { data: biz, error: bizErr } = await supabase
          .from('businesses')
          .select('id, business_name, tagline, bio, logo_url, owner_id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (bizErr) throw bizErr;
        if (!biz) throw new Error('No business found for this user');

        const b: Biz = {
          id: biz.id,
          name: biz.business_name || 'Your Business',
          logoUrl: biz.logo_url ?? null,
          avatarUrl: null,
          tagline: biz.tagline ?? null,
          aboutShort: biz.bio ?? null,
        };
        if (!alive) return;
        setBusiness(b);

        // Load published products for this user
        const { data: prods, error: prodErr } = await supabase
          .from('products')
          .select('id, title, description, price, status, asset_url')
          .eq('user_id', user.id)
          .eq('status', 'published');

        if (prodErr) throw prodErr;

        const mapped: ProductView[] = (prods ?? []).map((p: any) => ({
          id: p.id,
          name: p.title || 'Untitled Product',
          description: p.description ?? null,
          priceCents: p.price ? Math.round(p.price * 100) : 0,
          currency: 'NZD',
          imageUrl: p.asset_url ?? null,
        }));

        if (!alive) return;
        setProducts(mapped);
      } catch (e: any) {
        if (!alive) return;
        setBizError(e?.message ?? 'Failed to load business data');
      } finally {
        if (alive) setLoadingBiz(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load settings (draft + published)
  React.useEffect(() => {
    if (!business?.id) return;
    let alive = true;
    (async () => {
      setLoadingSettings(true);
      const s = await getSettings(business.id);
      if (!alive) return;

      const draft = s?.draft ?? {};
      const published = s?.published ?? null;

      setThemeDraft(draft.theme ?? published?.theme ?? {});
      setLayoutDraft(draft.layout ?? published?.layout ?? { columns: 3 });
      setShowAnnDraft(draft.show_announcement ?? published?.show_announcement ?? false);
      setAnnTextDraft(draft.announcement_text ?? published?.announcement_text ?? '');

      setPublishedSettings(published);
      setLoadingSettings(false);
    })();
    return () => { alive = false; };
  }, [business?.id]);

  async function handleSaveDraft() {
    if (!business?.id) return;
    const draftJson = {
      theme: themeDraft,
      layout: layoutDraft,
      show_announcement: showAnnDraft,
      announcement_text: annTextDraft || null,
    };
    const ok = await saveDraft(business.id, draftJson);
    console.log('save draft', ok);
  }

  async function handlePublish() {
    if (!business?.id) return;
    const ok = await publishDraft(business.id);
    console.log('publish', ok);
    // Refresh published snapshot after publish
    const s = await getSettings(business.id);
    setPublishedSettings(s?.published ?? null);
  }

  const loading = loadingBiz || loadingSettings;

  return (
    <AppSurface>
      <BackBar to="/hub/profile" label="Back to Profile" />

      <div className="mx-auto mt-6 grid max-w-screen-xl grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Controls */}
        <Card className="h-fit">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Shopfront Settings</h2>
              <div className="flex gap-2">
                <Button variant="outline" disabled={!business} onClick={handleSaveDraft}>Save draft</Button>
                <Button disabled={!business} onClick={handlePublish}>Publish</Button>
              </div>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as 'customer' | 'edit')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="customer">Customer view</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="space-y-4 pt-3">
                <section>
                  <h3 className="mb-2 text-sm font-medium">Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="primary">Primary color</Label>
                      <Input
                        id="primary"
                        placeholder="#111111"
                        value={themeDraft.primary ?? ''}
                        onChange={(e) => setThemeDraft({ ...themeDraft, primary: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accent">Accent color</Label>
                      <Input
                        id="accent"
                        placeholder="#4994D5"
                        value={themeDraft.accent ?? ''}
                        onChange={(e) => setThemeDraft({ ...themeDraft, accent: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="radius">Radius</Label>
                      <Input
                        id="radius"
                        placeholder="sm | md | xl"
                        value={(themeDraft.radius ?? '') as any}
                        onChange={(e) => setThemeDraft({ ...themeDraft, radius: e.target.value as any })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="density">Density</Label>
                      <Input
                        id="density"
                        placeholder="cozy | comfy | spacious"
                        value={(themeDraft.density ?? '') as any}
                        onChange={(e) => setThemeDraft({ ...themeDraft, density: e.target.value as any })}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Layout</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="columns">Grid columns (1–4)</Label>
                      <Input
                        id="columns"
                        type="number"
                        min={1}
                        max={4}
                        value={layoutDraft.columns ?? 3}
                        onChange={(e) =>
                          setLayoutDraft({ ...layoutDraft, columns: Math.max(1, Math.min(4, Number(e.target.value))) })
                        }
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Announcement</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="showAnn"
                        type="checkbox"
                        checked={showAnnDraft}
                        onChange={(e) => setShowAnnDraft(e.target.checked)}
                      />
                      <Label htmlFor="showAnn">Show announcement bar</Label>
                    </div>
                    <Input
                      placeholder="Free shipping this week! ✨"
                      value={annTextDraft}
                      onChange={(e) => setAnnTextDraft(e.target.value)}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Deep links</h3>
                  <div className="grid gap-2">
                    <Button asChild variant="outline"><a href="/hub/profile/business">Edit Business Profile</a></Button>
                    <Button asChild variant="outline"><a href="/hub/products">Edit Products</a></Button>
                    <Button asChild variant="outline"><a href="/hub/profile/user">Edit User Profile</a></Button>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="customer" className="pt-3 text-sm text-muted-foreground">
                This shows **published** theme/layout (not your draft). Edit and Publish to update.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="min-w-0">
          {bizError ? (
            <div className="rounded-xl border p-8 text-sm text-red-600">{bizError}</div>
          ) : (loading || !business) ? (
            <div className="rounded-xl border p-8 text-sm text-muted-foreground">Loading preview…</div>
          ) : (
            <ShopfrontView
              business={business}
              settings={
                tab === 'customer' && publishedSettings
                  ? { layout: publishedSettings.layout ?? { columns: 3 } }
                  : { layout: layoutDraft }
              }
              products={products}
              onQueryChange={() => {}}
            />
          )}
        </div>
      </div>
    </AppSurface>
  );
}

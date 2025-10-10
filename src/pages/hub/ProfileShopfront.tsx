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

// TODO: Replace with real business & owner context
const CURRENT_BUSINESS = {
  id: 'owner-business-id',               // Replace by reading the actual business id from profile store or Supabase
  name: 'Your Business',
  logoUrl: undefined as string | undefined,
  avatarUrl: undefined as string | undefined,
  tagline: 'We do awesome things.',
  aboutShort: 'Short about copy here.',
  contactEmail: null as string | null,
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
  const business = CURRENT_BUSINESS; // swap to real data when available
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<'customer' | 'edit'>('edit');
  const [theme, setTheme] = React.useState<{ primary?: string; accent?: string; radius?: 'sm'|'md'|'xl'; density?: 'cozy'|'comfy'|'spacious' }>({});
  const [layout, setLayout] = React.useState<{ columns?: number }>({ columns: 3 });
  const [showAnn, setShowAnn] = React.useState(false);
  const [annText, setAnnText] = React.useState<string>('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getSettings(business.id);
      if (!mounted) return;
      // Prefer draft in editor view, published in customer view (simple approach for now)
      const draft = s.draft ?? {};
      const published = s.published ?? {};
      setTheme(draft.theme ?? published.theme ?? {});
      setLayout(draft.layout ?? published.layout ?? { columns: 3 });
      setShowAnn(draft.show_announcement ?? published.show_announcement ?? false);
      setAnnText(draft.announcement_text ?? published.announcement_text ?? '');
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [business.id]);

  async function handleSaveDraft() {
    const draftJson = {
      theme, layout,
      show_announcement: showAnn,
      announcement_text: annText || null,
    };
    const ok = await saveDraft(business.id, draftJson);
    // You can surface a toast using your existing hooks
    console.log('save draft', ok);
  }

  async function handlePublish() {
    const ok = await publishDraft(business.id);
    console.log('publish', ok);
  }

  // Preview data (no product fetch here yet)
  const previewProducts = [
    { id: 'p1', name: 'Sample Product', description: 'A short description for preview.', priceCents: 1999, imageUrl: undefined, currency: 'NZD' },
    { id: 'p2', name: 'Another Product', description: 'Description...', priceCents: 4999, imageUrl: undefined, currency: 'NZD' },
  ];

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
                <Button variant="outline" onClick={handleSaveDraft}>Save draft</Button>
                <Button onClick={handlePublish}>Publish</Button>
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
                      <Input id="primary" placeholder="#111111" value={theme.primary ?? ''} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="accent">Accent color</Label>
                      <Input id="accent" placeholder="#4994D5" value={theme.accent ?? ''} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="radius">Radius</Label>
                      <Input id="radius" placeholder="sm | md | xl" value={theme.radius ?? '' as any} onChange={(e) => setTheme({ ...theme, radius: e.target.value as any })} />
                    </div>
                    <div>
                      <Label htmlFor="density">Density</Label>
                      <Input id="density" placeholder="cozy | comfy | spacious" value={theme.density ?? '' as any} onChange={(e) => setTheme({ ...theme, density: e.target.value as any })} />
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
                        value={layout.columns ?? 3}
                        onChange={(e) => setLayout({ ...layout, columns: Math.max(1, Math.min(4, Number(e.target.value))) })}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium">Announcement</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <input id="showAnn" type="checkbox" checked={showAnn} onChange={(e) => setShowAnn(e.target.checked)} />
                      <Label htmlFor="showAnn">Show announcement bar</Label>
                    </div>
                    <Input placeholder="Free shipping this week! ✨" value={annText} onChange={(e) => setAnnText(e.target.value)} />
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
                This is how customers will see your published shopfront.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="min-w-0">
          {loading ? (
            <div className="rounded-xl border p-8 text-sm text-muted-foreground">Loading preview…</div>
          ) : (
            <ShopfrontView
              business={business}
              settings={{ layout }}
              products={previewProducts}
              onQueryChange={() => {}}
            />
          )}
        </div>
      </div>
    </AppSurface>
  );
}

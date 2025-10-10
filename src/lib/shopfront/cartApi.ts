import type { Cart, CartItem } from '@/types/shopfront';
import { supabaseShopfront } from '@/lib/supabaseClientShopfront';
import { getAnonId } from '@/lib/anon';

// PHASE 3: Try Supabase (carts/cart_items) with RLS; fallback to localStorage.
// The public page may choose to use this. Onboarding remains untouched.

const KEY = (businessId: string, userKey?: string | null) =>
  `sh_cart_${businessId}_${userKey ?? 'guest'}`;

function now() { return Date.now(); }
function readLS(businessId: string, userKey?: string | null): Cart | null {
  if (typeof window === 'undefined') return null;
  try { const raw = window.localStorage.getItem(KEY(businessId, userKey)); return raw ? JSON.parse(raw) as Cart : null; } catch { return null; }
}
function writeLS(cart: Cart, userKey?: string | null) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(KEY(cart.businessId, userKey), JSON.stringify(cart)); } catch {}
}

async function readDBCart(businessId: string, userId?: string | null): Promise<Cart | null> {
  try {
    const anonId = userId ? null : getAnonId();
    const { data: carts, error } = await supabaseShopfront
      .from('carts')
      .select('id,business_id,user_id,anon_id,updated_at,cart_items(id,product_id,option_id,qty,price_cents_snapshot,name_snapshot)')
      .eq('business_id', businessId)
      .maybeSingle();
    if (error) throw error;
    if (!carts) return null;
    const items = (carts.cart_items ?? []).map((ci: any) => ({
      productId: ci.product_id, optionId: ci.option_id ?? null, qty: ci.qty,
      priceCentsSnapshot: ci.price_cents_snapshot, nameSnapshot: ci.name_snapshot
    }));
    return {
      id: carts.id, businessId: carts.business_id,
      userId: carts.user_id ?? null, anonId: carts.anon_id ?? anonId,
      items, updatedAt: new Date(carts.updated_at).getTime(),
    };
  } catch { return null; }
}

async function upsertDBCart(cart: Cart, userKey?: string | null): Promise<Cart | null> {
  try {
    const { data, error } = await supabaseShopfront
      .from('carts')
      .upsert({
        id: cart.id, business_id: cart.businessId,
        user_id: cart.userId ?? null, anon_id: cart.anonId ?? (userKey ?? getAnonId()),
        updated_at: new Date(cart.updatedAt).toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return cart;
  } catch { return null; }
}

async function replaceDBItems(cart: Cart): Promise<boolean> {
  try {
    // delete existing
    const del = await supabaseShopfront.from('cart_items').delete().eq('cart_id', cart.id);
    if (del.error) throw del.error;
    if (cart.items.length === 0) return true;
    const ins = await supabaseShopfront.from('cart_items').insert(
      cart.items.map((it) => ({
        cart_id: cart.id, product_id: it.productId, option_id: it.optionId ?? null,
        qty: it.qty, price_cents_snapshot: it.priceCentsSnapshot, name_snapshot: it.nameSnapshot
      }))
    );
    if (ins.error) throw ins.error;
    return true;
  } catch { return false; }
}

export function getOrCreateCart(args: { businessId: string; userId?: string | null; anonId?: string | null; }): Cart {
  const userKey = args.userId ?? args.anonId ?? getAnonId();
  const ls = readLS(args.businessId, userKey);
  if (ls) return ls;

  const cart: Cart = {
    id: crypto?.randomUUID?.() ?? `${args.businessId}-${now()}`,
    businessId: args.businessId,
    userId: args.userId ?? null,
    anonId: args.userId ? null : (args.anonId ?? getAnonId()),
    items: [],
    updatedAt: now(),
  };
  writeLS(cart, userKey);
  // fire-and-forget DB upsert (safe)
  void upsertDBCart(cart, userKey);
  return cart;
}

export async function syncCart(cart: Cart, userKey?: string | null): Promise<void> {
  const ok = await upsertDBCart(cart, userKey);
  if (!ok) return; // LS remains the source of truth on failure
  await replaceDBItems(cart);
}

export function addItem(cart: Cart, item: Omit<CartItem, 'qty'> & { qty?: number }, userKey?: string | null): Cart {
  const qty = item.qty && item.qty > 0 ? item.qty : 1;
  const idx = cart.items.findIndex((it) => it.productId === item.productId && it.optionId === (item.optionId ?? null));
  if (idx >= 0) cart.items[idx].qty += qty; else cart.items.push({ ...item, qty });
  cart.updatedAt = now(); writeLS(cart, userKey); void syncCart(cart, userKey);
  return cart;
}

export function updateItemQty(cart: Cart, productId: string, optionId: string | null, qty: number, userKey?: string | null): Cart {
  const idx = cart.items.findIndex((it) => it.productId === productId && it.optionId === optionId);
  if (idx >= 0) {
    cart.items[idx].qty = Math.max(0, qty);
    if (cart.items[idx].qty === 0) cart.items.splice(idx, 1);
    cart.updatedAt = now(); writeLS(cart, userKey); void syncCart(cart, userKey);
  }
  return cart;
}

export function removeItem(cart: Cart, productId: string, optionId: string | null, userKey?: string | null): Cart {
  const idx = cart.items.findIndex((it) => it.productId === productId && it.optionId === optionId);
  if (idx >= 0) {
    cart.items.splice(idx, 1);
    cart.updatedAt = now(); writeLS(cart, userKey); void syncCart(cart, userKey);
  }
  return cart;
}

export function clear(cart: Cart, userKey?: string | null): Cart {
  cart.items = []; cart.updatedAt = now(); writeLS(cart, userKey); void syncCart(cart, userKey);
  return cart;
}

export function mergeGuestCart(params: { businessId: string; anonId: string; userId: string; }): Cart {
  const guest = readLS(params.businessId, params.anonId);
  const user = readLS(params.businessId, params.userId) ?? {
    id: crypto?.randomUUID?.() ?? `${params.businessId}-${now()}`,
    businessId: params.businessId, userId: params.userId, anonId: null, items: [], updatedAt: now(),
  } as Cart;

  if (guest) {
    for (const gi of guest.items) {
      const idx = user.items.findIndex((ui) => ui.productId === gi.productId && ui.optionId === gi.optionId);
      if (idx >= 0) user.items[idx].qty += gi.qty; else user.items.push({ ...gi });
    }
  }

  user.updatedAt = now();
  writeLS(user, params.userId);
  void syncCart(user, params.userId);
  try { localStorage.removeItem(KEY(params.businessId, params.anonId)); } catch {}
  return user;
}

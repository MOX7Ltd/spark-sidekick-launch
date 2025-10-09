import type { Cart, CartItem } from '@/types/shopfront';

// PHASE 0: LocalStorage-first, non-throwing, no server writes.
// Later phases can swap the internals to Supabase while keeping this interface.

const KEY = (businessId: string, userKey?: string | null) =>
  `sh_cart_${businessId}_${userKey ?? 'guest'}`;

function now() {
  return Date.now();
}

function read(businessId: string, userKey?: string | null): Cart | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY(businessId, userKey));
    return raw ? (JSON.parse(raw) as Cart) : null;
  } catch {
    return null;
  }
}

function write(cart: Cart, userKey?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY(cart.businessId, userKey), JSON.stringify(cart));
  } catch {
    // ignore
  }
}

export function getOrCreateCart(args: {
  businessId: string;
  userId?: string | null;
  anonId?: string | null;
}): Cart {
  const userKey = args.userId ?? args.anonId ?? null;
  const existing = read(args.businessId, userKey);
  if (existing) return existing;

  const cart: Cart = {
    id: crypto?.randomUUID?.() ?? `${args.businessId}-${now()}`,
    businessId: args.businessId,
    userId: args.userId ?? null,
    anonId: args.userId ? null : (args.anonId ?? null),
    items: [],
    updatedAt: now(),
  };
  write(cart, userKey);
  return cart;
}

export function addItem(
  cart: Cart,
  item: Omit<CartItem, 'qty'> & { qty?: number },
  userKey?: string | null
): Cart {
  const qty = item.qty && item.qty > 0 ? item.qty : 1;
  const idx = cart.items.findIndex(
    (it) => it.productId === item.productId && it.optionId === (item.optionId ?? null)
  );
  if (idx >= 0) {
    cart.items[idx].qty += qty;
  } else {
    cart.items.push({ ...item, qty });
  }
  cart.updatedAt = now();
  write(cart, userKey);
  return cart;
}

export function updateItemQty(
  cart: Cart,
  productId: string,
  optionId: string | null,
  qty: number,
  userKey?: string | null
): Cart {
  const idx = cart.items.findIndex((it) => it.productId === productId && it.optionId === optionId);
  if (idx >= 0) {
    cart.items[idx].qty = Math.max(0, qty);
    if (cart.items[idx].qty === 0) cart.items.splice(idx, 1);
    cart.updatedAt = now();
    write(cart, userKey);
  }
  return cart;
}

export function removeItem(
  cart: Cart,
  productId: string,
  optionId: string | null,
  userKey?: string | null
): Cart {
  const idx = cart.items.findIndex((it) => it.productId === productId && it.optionId === optionId);
  if (idx >= 0) {
    cart.items.splice(idx, 1);
    cart.updatedAt = now();
    write(cart, userKey);
  }
  return cart;
}

export function clear(cart: Cart, userKey?: string | null): Cart {
  cart.items = [];
  cart.updatedAt = now();
  write(cart, userKey);
  return cart;
}

// Merge guest cart into user cart (later: call this on sign-in)
export function mergeGuestCart(params: {
  businessId: string;
  anonId: string;
  userId: string;
}): Cart {
  const guest = read(params.businessId, params.anonId);
  const user = read(params.businessId, params.userId) ??
    getOrCreateCart({ businessId: params.businessId, userId: params.userId });

  if (guest) {
    for (const gi of guest.items) {
      const idx = user.items.findIndex(
        (ui) => ui.productId === gi.productId && ui.optionId === gi.optionId
      );
      if (idx >= 0) user.items[idx].qty += gi.qty;
      else user.items.push({ ...gi });
    }
  }

  user.updatedAt = now();
  write(user, params.userId);

  // Clear guest local storage
  try { localStorage.removeItem(KEY(params.businessId, params.anonId)); } catch {}
  return user;
}

import { projectId } from './supabase/info';

export type CheckoutSession = {
  offerId: string;
  purchaseId: string;
  email: string;
  name: string;
  pendingUpsell?: { purchaseId: string; offerId: string };
  boughtOfferIds?: string[];
  discountEndsAt?: number;
};
const key = 'guardian-checkout';
const lifetime = 24 * 60 * 60 * 1000;
// Session-scoped recovery only. Never store a Stripe client secret or card data.
export function saveCheckoutSession(session: CheckoutSession) {
  try { sessionStorage.setItem(key, JSON.stringify({ ...session, projectId, savedAt: Date.now() })); } catch { /* Storage can be disabled; the current checkout still works. */ }
}
export function readCheckoutSession(offerId: string): CheckoutSession | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!data || data.projectId !== projectId || data.offerId !== offerId || typeof data.purchaseId !== 'string' || !data.purchaseId || typeof data.email !== 'string' || typeof data.name !== 'string' || typeof data.savedAt !== 'number' || Date.now() - data.savedAt > lifetime || data.savedAt > Date.now()) return null;
    if (data.pendingUpsell && (typeof data.pendingUpsell.purchaseId !== 'string' || typeof data.pendingUpsell.offerId !== 'string')) return null;
    if (data.boughtOfferIds && (!Array.isArray(data.boughtOfferIds) || data.boughtOfferIds.some((id: unknown) => typeof id !== 'string'))) return null;
    return data;
  } catch { return null; }
}
export function clearCheckoutSession() { try { sessionStorage.removeItem(key); } catch { /* Optional storage. */ } }
export function checkoutReturnUrl(offerId: string) {
  const url = new URL(window.location.href);
  for (const param of ['payment_intent', 'payment_intent_client_secret', 'redirect_status']) url.searchParams.delete(param);
  url.searchParams.set('guardian_checkout', offerId);
  return url.href;
}
export function clearCheckoutReturnParameters() {
  const url = new URL(window.location.href);
  for (const param of ['guardian_checkout', 'payment_intent', 'payment_intent_client_secret', 'redirect_status']) url.searchParams.delete(param);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

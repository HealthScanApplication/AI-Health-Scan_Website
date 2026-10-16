// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { saveCheckoutSession, readCheckoutSession, checkoutReturnUrl, clearCheckoutReturnParameters } from '../guardianCheckoutSession';
beforeEach(() => { sessionStorage.clear(); history.replaceState({}, '', '/guardians/qa'); });
const session = { offerId: 'offer', purchaseId: 'purchase', email: 'qa@example.invalid', name: 'QA' };
it('restores an existing order without persisting Stripe secrets', () => {
  saveCheckoutSession(session);
  expect(readCheckoutSession('offer')).toMatchObject(session);
  expect(readCheckoutSession('another')).toBeNull();
  expect(sessionStorage.getItem('guardian-checkout')).not.toContain('client_secret');
});
it('creates a return URL and removes only payment recovery parameters', () => {
  history.replaceState({}, '', '/guardians/qa?campaign=abc#offer');
  const url = new URL(checkoutReturnUrl('offer'));
  expect(url.searchParams.get('guardian_checkout')).toBe('offer');
  history.replaceState({}, '', `${url.pathname}${url.search}&payment_intent=pi_test&payment_intent_client_secret=secret&redirect_status=succeeded${url.hash}`);
  clearCheckoutReturnParameters();
  expect(location.search).toBe('?campaign=abc');
  expect(location.hash).toBe('#offer');
});
it('treats corrupt or expired session data as unavailable', () => {
  sessionStorage.setItem('guardian-checkout', '{');
  expect(readCheckoutSession('offer')).toBeNull();
  saveCheckoutSession(session);
  const data = JSON.parse(sessionStorage.getItem('guardian-checkout')!);
  sessionStorage.setItem('guardian-checkout', JSON.stringify({ ...data, savedAt: 0 }));
  expect(readCheckoutSession('offer')).toBeNull();
});

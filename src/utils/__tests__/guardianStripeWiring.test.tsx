// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OfferCheckout } from '../../components/guides/GuidePortal';
import { resolveGuardianStripe } from '../guardianStripe';
const state = vi.hoisted(()=>{
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY','pk_live_LegacyIgnored');
  return {projectId:'mofhvoudjxinvpplsytd',start:vi.fn(),stripe:vi.fn()};
});
vi.mock('../supabase/info',()=>({get projectId(){return state.projectId;},publicAnonKey:'test-public-key'}));
vi.mock('../../utils/guidePortal',async original=>({...await original<any>(),createOfferPayment:state.start}));
const offer={id:'qa-offer',title:'QA offer',currency:'GBP',price_cents:100,kind:'ebook',access_model:'paid',status:'published'} as any;
const profile={display_name:'QA Guardian',slug:'qa',avatar_url:null} as any;
beforeEach(()=>{
  state.projectId='mofhvoudjxinvpplsytd';
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY','pk_live_LegacyIgnored');
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY_STAGING','pk_test_StagingAccount');
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY_PRODUCTION','pk_live_ProductionAccount');
  state.start.mockReset().mockResolvedValue({purchase_id:'qa-order',client_secret:'pi_test_secret_fake',amount_cents:100,currency:'GBP'});
  state.stripe.mockReset().mockReturnValue({elements:()=>({create:()=>({on:()=>{},mount:()=>{},destroy:()=>{}})})});
  (window as any).Stripe=state.stripe;
});
afterEach(()=>{cleanup();delete (window as any).Stripe;vi.unstubAllEnvs();});
function begin(){
  render(<OfferCheckout offer={offer} upsells={[]} profile={profile} accent="#000" onClose={()=>{}} />);
  fireEvent.change(screen.getByRole('textbox',{name:'First name'}),{target:{value:'QA'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Email'}),{target:{value:'qa@example.invalid'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue to payment'}));
}
it('uses the staging key for the staging database, never the legacy/live key',async()=>{
  begin();await screen.findByRole('button',{name:'Pay £1'});
  expect(state.stripe).toHaveBeenCalledWith('pk_test_StagingAccount');
});
it.each(['','pk_live_WrongMode','sk_test_NotPublishable'])('rejects invalid staging key %s before contacting Stripe or creating a purchase',async key=>{
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY_STAGING',key);
  begin();await screen.findByRole('alert');
  expect(state.stripe).not.toHaveBeenCalled();expect(state.start).not.toHaveBeenCalled();
});
it('keeps production payments off even when a valid production key is configured',async()=>{
  vi.stubEnv('VITE_GUARDIAN_LIVE_PAYMENTS_ENABLED','true');
  state.projectId='ermbkttsyvpenjjxaxcf';begin();
  expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Live payments are disabled'));
  expect(state.stripe).not.toHaveBeenCalled();expect(state.start).not.toHaveBeenCalled();
});
it('wires the production project to its live key while retaining the release hold',()=>{
  const result=resolveGuardianStripe('ermbkttsyvpenjjxaxcf',{VITE_STRIPE_PUBLISHABLE_KEY_STAGING:'pk_test_StagingAccount',VITE_STRIPE_PUBLISHABLE_KEY_PRODUCTION:' pk_live_ProductionAccount '});
  expect(result.publishableKey).toBe('pk_live_ProductionAccount');
  expect(result.environment).toBe('production');expect(result.enabled).toBe(false);
});
it.each(['pk_test_WrongMode','rk_live_NotPublishable','sk_live_NotPublishable',''])('rejects invalid production key %s',key=>{
  const result=resolveGuardianStripe('ermbkttsyvpenjjxaxcf',{VITE_STRIPE_PUBLISHABLE_KEY_PRODUCTION:key});
  expect(result.publishableKey).toBeNull();expect(result.enabled).toBe(false);
});
it('fails closed for an unknown database project',async()=>{
  state.projectId='unrecognized-project';begin();await screen.findByRole('alert');
  expect(state.stripe).not.toHaveBeenCalled();expect(state.start).not.toHaveBeenCalled();
});

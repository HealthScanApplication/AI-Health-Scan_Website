// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OfferCheckout } from '../../components/guides/GuidePortal';
import { saveCheckoutSession } from '../guardianCheckoutSession';
const api=vi.hoisted(()=>({ confirm:vi.fn(),pay:vi.fn(),upsell:vi.fn(),authenticate:vi.fn(),autoReady:true, handlers:{} as Record<string,(event?:any)=>void> }));
vi.mock('../../utils/guidePortal',async original=>({...await original<any>(),
  createOfferPayment:async()=>({purchase_id:'qa-order',client_secret:'pi_test_secret_fake',amount_cents:100,currency:'GBP'}),
  confirmOfferPayment:api.confirm,
  buyUpsellOneClick:api.upsell,
  recoverUpsellPayment:api.upsell,
}));
const offer={id:'qa-offer',title:'QA offer',currency:'GBP',price_cents:100,kind:'ebook',access_model:'paid',status:'published'} as any;
const profile={display_name:'QA Guardian',slug:'qa',avatar_url:null} as any;
beforeEach(()=>{
  sessionStorage.clear();
  api.autoReady=true;api.handlers={};
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY_STAGING','pk_test_CheckoutFixture');
  api.confirm.mockReset().mockResolvedValue({status:'paid',discount_ends_at:Date.now()+600000});
  api.pay.mockReset().mockResolvedValue({paymentIntent:{status:'succeeded'}});
  api.upsell.mockReset();
  api.authenticate.mockReset().mockResolvedValue({});
  (window as any).Stripe=()=>({elements:()=>({create:()=>{
    let input:HTMLInputElement;
    return {on:(event:string,handler:(event?:any)=>void)=>{api.handlers[event]=handler;},mount:(node:HTMLElement)=>{ input=document.createElement('input');input.setAttribute('aria-label','Test card details');node.appendChild(input);if(api.autoReady)queueMicrotask(()=>api.handlers.ready?.()); },destroy:()=>input?.remove()};
  }}),confirmPayment:api.pay,handleNextAction:api.authenticate});
  vi.stubGlobal('requestAnimationFrame',(fn:()=>void)=>setTimeout(fn,0));
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();delete (window as any).Stripe;});
async function checkout(upsells:any[]=[]){
  render(<OfferCheckout offer={offer} upsells={upsells} profile={profile} accent="#000" onClose={()=>{}} />);
  fireEvent.change(screen.getByRole('textbox',{name:'First name'}),{target:{value:'QA'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Email'}),{target:{value:'qa@example.invalid'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue to payment'}));
  await screen.findByRole('textbox',{name:'Test card details'});
  if(api.autoReady)await waitFor(()=>expect((screen.getByRole('button',{name:'Pay £1'}) as HTMLButtonElement).disabled).toBe(false));
}
it('does not allow payment until Stripe reports the card widget ready',async()=>{
  api.autoReady=false;await checkout();
  const pay=screen.getByRole('button',{name:'Pay £1'}) as HTMLButtonElement;
  expect(pay.disabled).toBe(true);
  fireEvent.submit(pay.form!);
  expect(api.pay).not.toHaveBeenCalled();
  await act(async()=>api.handlers.ready?.());
  expect(pay.disabled).toBe(false);
});
it('checks a returned order without creating or submitting another payment',async()=>{
  saveCheckoutSession({offerId:offer.id,purchaseId:'returned-order',email:'qa@example.invalid',name:'QA'});
  render(<OfferCheckout offer={offer} upsells={[]} profile={profile} accent="#000" onClose={()=>{}} />);
  fireEvent.click(await screen.findByRole('button',{name:'Check payment status'}));
  await screen.findByRole('heading',{name:'You’re all set!'});
  expect(api.confirm).toHaveBeenCalledWith('returned-order');
  expect(api.pay).not.toHaveBeenCalled();
});
it('keeps an async upsell pending and checks that upsell rather than the original order',async()=>{
  const upsell={...offer,id:'upsell',title:'QA follow-on'};
  await checkout([upsell]);
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  const accept=await screen.findByRole('button',{name:/Get limited offer/});
  api.upsell.mockResolvedValue({purchase_id:'upsell-order',status:'pending'});
  fireEvent.click(accept);
  const check=await screen.findByRole('button',{name:'Check payment status'});
  expect(screen.queryByText(/Your card was not charged/)).toBeNull();
  fireEvent.click(check);
  await screen.findByRole('heading',{name:'You’re all set!'});
  expect(api.confirm).toHaveBeenLastCalledWith('upsell-order');
  expect(api.upsell).toHaveBeenCalledTimes(1);
});
it('resumes authentication on the same interrupted upsell after reload',async()=>{
  const upsell={...offer,id:'upsell',title:'QA follow-on'};
  saveCheckoutSession({offerId:offer.id,purchaseId:'initial-order',email:'qa@example.invalid',name:'QA',pendingUpsell:{purchaseId:'upsell-order',offerId:'upsell'},boughtOfferIds:[offer.id]});
  api.confirm.mockResolvedValueOnce({status:'requires_action'}).mockResolvedValueOnce({status:'paid'});
  api.upsell.mockResolvedValue({purchase_id:'upsell-order',status:'requires_action',client_secret:'test_secret'});
  render(<OfferCheckout offer={offer} upsells={[upsell]} profile={profile} accent="#000" onClose={()=>{}} />);
  fireEvent.click(screen.getByRole('button',{name:'Check payment status'}));
  await screen.findByRole('heading',{name:'You’re all set!'});
  expect(api.authenticate).toHaveBeenCalledWith({clientSecret:'test_secret'});
  expect(api.confirm).toHaveBeenLastCalledWith('upsell-order');
});
it('uses the server discount deadline and requires review if the quoted price changes',async()=>{
  const upsell={...offer,id:'upsell',title:'QA follow-on'};
  api.confirm.mockResolvedValue({status:'paid',discount_ends_at:Date.now()-1000});
  await checkout([upsell]);
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  const accept=await screen.findByRole('button',{name:'Get it now'});
  api.upsell.mockRejectedValue(new Error('Offer price changed. Review the updated price before paying.'));
  fireEvent.click(accept);
  await screen.findByRole('alert');
  expect(api.upsell).toHaveBeenCalledWith('qa-order','upsell',100);
  expect(screen.getByRole('button',{name:'Get it now'})).toBeTruthy();
});
it('keeps a lost upsell response unresolved and does not check the original paid order',async()=>{
  const upsell={...offer,id:'upsell',title:'QA follow-on'};
  await checkout([upsell]);
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  const accept=await screen.findByRole('button',{name:/Get limited offer/});
  api.upsell.mockRejectedValueOnce(new Error('Network interrupted')).mockResolvedValue({purchase_id:'',status:'pending'});
  fireEvent.click(accept);
  fireEvent.click(await screen.findByRole('button',{name:'Check payment status'}));
  await waitFor(()=>expect(api.upsell).toHaveBeenCalledTimes(2));
  expect(api.confirm).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('heading',{name:'You’re all set!'})).toBeNull();
  expect(screen.queryByRole('button',{name:/Use another payment method/})).toBeNull();
});
it('keeps payment disabled and explains a Stripe widget load failure',async()=>{
  api.autoReady=false;await checkout();
  await act(async()=>api.handlers.loaderror?.({error:{message:'External widget failed'}}));
  expect((screen.getByRole('button',{name:'Pay £1'}) as HTMLButtonElement).disabled).toBe(true);
  expect(await screen.findByRole('alert')).toBeTruthy();
});
it('explains a stalled widget and recovers if Stripe becomes ready later',async()=>{
  let loadingTimeout:()=>void=()=>{throw new Error('Loading timeout not registered');};
  const realTimeout=window.setTimeout.bind(window);
  vi.spyOn(window,'setTimeout').mockImplementation(((handler:any,delay?:number,...args:any[])=>{
    if(delay===15000)loadingTimeout=handler;
    return realTimeout(handler,delay,...args);
  }) as any);
  api.autoReady=false;await checkout();
  await act(async()=>loadingTimeout());
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect((screen.getByRole('button',{name:'Pay £1'}) as HTMLButtonElement).disabled).toBe(true);
  await act(async()=>api.handlers.ready?.());
  expect(screen.queryByRole('alert')).toBeNull();
  expect((screen.getByRole('button',{name:'Pay £1'}) as HTMLButtonElement).disabled).toBe(false);
});
it('shows processing without claiming the order is complete',async()=>{
  await checkout(); api.pay.mockResolvedValue({paymentIntent:{status:'processing'}});
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  await screen.findByText(/Payment is processing/);
  expect(screen.queryByRole('heading',{name:'You’re all set!'})).toBeNull();
});
it('does not confirm an order when server verification fails',async()=>{
  await checkout(); api.confirm.mockRejectedValue(new Error('Order verification unavailable'));
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('heading',{name:'You’re all set!'})).toBeNull();
});
it('keeps a declined card retryable and does not show a success screen',async()=>{
  await checkout();api.pay.mockResolvedValue({error:{message:'Your card was declined.'}});
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','Your card was declined.');
  expect((screen.getByRole('button',{name:'Pay £1'}) as HTMLButtonElement).disabled).toBe(false);
});
it('shows success only after server verification reports paid',async()=>{
  await checkout();
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  expect(await screen.findByRole('heading',{name:'You’re all set!'})).toBeTruthy();
  expect(screen.getByText('Payment confirmed for qa@example.invalid')).toBeTruthy();
});
it('checks an uncertain payment without submitting another charge',async()=>{
  await checkout();api.pay.mockResolvedValue({paymentIntent:{status:'processing'}});
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  fireEvent.click(await screen.findByRole('button',{name:'Check payment status'}));
  await screen.findByRole('heading',{name:'You’re all set!'});
  expect(api.pay).toHaveBeenCalledTimes(1);
});
it('handles a Stripe transport rejection without freezing in paying',async()=>{
  await checkout();api.pay.mockRejectedValue(new Error('Network interrupted'));
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  expect(await screen.findByRole('button',{name:'Check payment status'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Paying…'})).toBeNull();
});
it('restores editable payment details after a pending payment fails',async()=>{
  await checkout();await screen.findByRole('textbox',{name:'Test card details'});
  api.pay.mockRejectedValue(new Error('Network interrupted'));
  fireEvent.click(screen.getByRole('button',{name:'Pay £1'}));
  const check=await screen.findByRole('button',{name:'Check payment status'});
  api.confirm.mockResolvedValue({status:'failed'});
  fireEvent.click(check);
  expect(await screen.findByRole('textbox',{name:'Test card details'})).toBeTruthy();
  expect((screen.getByRole('button',{name:'Pay £1'}) as HTMLButtonElement).disabled).toBe(false);
});

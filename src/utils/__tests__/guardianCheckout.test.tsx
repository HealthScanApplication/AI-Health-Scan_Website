// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OfferCheckout } from '../../components/guides/GuidePortal';
const api=vi.hoisted(()=>({ confirm:vi.fn(),pay:vi.fn() }));
vi.mock('../../utils/guidePortal',async original=>({...await original<any>(),
  createOfferPayment:async()=>({purchase_id:'qa-order',client_secret:'pi_test_secret_fake',amount_cents:100,currency:'GBP'}),
  confirmOfferPayment:api.confirm,
}));
const offer={id:'qa-offer',title:'QA offer',currency:'GBP',price_cents:100,kind:'ebook',access_model:'paid',status:'published'} as any;
const profile={display_name:'QA Guardian',slug:'qa',avatar_url:null} as any;
beforeEach(()=>{
  api.confirm.mockReset().mockResolvedValue({status:'paid'});
  api.pay.mockReset().mockResolvedValue({paymentIntent:{status:'succeeded'}});
  (window as any).Stripe=()=>({elements:()=>({create:()=>{
    let input:HTMLInputElement;
    return {mount:(node:HTMLElement)=>{ input=document.createElement('input');input.setAttribute('aria-label','Test card details');node.appendChild(input); },destroy:()=>input?.remove()};
  }}),confirmPayment:api.pay});
  vi.stubGlobal('requestAnimationFrame',(fn:()=>void)=>setTimeout(fn,0));
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();delete (window as any).Stripe;});
async function checkout(){
  render(<OfferCheckout offer={offer} upsells={[]} profile={profile} accent="#000" onClose={()=>{}} />);
  fireEvent.change(screen.getByRole('textbox',{name:'First name'}),{target:{value:'QA'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Email'}),{target:{value:'qa@example.invalid'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue to payment'}));
  await screen.findByRole('button',{name:'Pay £1'});
}
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

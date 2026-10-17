// @vitest-environment jsdom
import React, {useState} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {DietLocationHeader} from '../../components/guides/DietLocationHeader';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('lets the user search and choose a city without using geolocation or external services',async()=>{
  const fetch=vi.fn(()=>{throw Error('No external service should be contacted');});vi.stubGlobal('fetch',fetch);
  function Demo(){const [city,setCity]=useState<any>();return <DietLocationHeader city={city} onChange={setCity} now={new Date('2026-10-17T12:00:00Z')} />;}
  render(<Demo/>);
  fireEvent.change(screen.getByRole('textbox',{name:'Planner city'}),{target:{value:'Warsaw'}});
  fireEvent.click(screen.getByRole('button',{name:'Find city'}));
  fireEvent.click(await screen.findByRole('button',{name:/Warsaw, Poland/}));
  expect(screen.getByText(/Sunrise today/).textContent).toMatch(/07:[01]\d/);
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Clear city'}));
  expect(screen.getByText('Choose a city for sunrise')).toBeTruthy();
});
it('does not request device location on mount and explains permission denial',async()=>{
  const getCurrentPosition=vi.fn((_:unknown,error:any)=>error({code:1}));
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition}});
  render(<DietLocationHeader onChange={()=>{}} now={new Date()}/>);
  expect(getCurrentPosition).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Use my location'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Choose a city manually'));
});

import { getTimes } from 'suncalc';

export interface PlannerLocation { name:string; country:string; latitude:number; longitude:number; timezone:string }
export function validPlannerLocation(value: unknown): value is PlannerLocation {
  const p = value as PlannerLocation | null;
  if (!p || typeof p.name !== 'string' || !p.name.trim() || typeof p.country !== 'string' || !Number.isFinite(p.latitude) || Math.abs(p.latitude)>90 || !Number.isFinite(p.longitude) || Math.abs(p.longitude)>180 || typeof p.timezone !== 'string') return false;
  try { new Intl.DateTimeFormat('en',{timeZone:p.timezone}); return true; } catch { return false; }
}
export function plannerDate(timezone:string, now=new Date()): string {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=(key:string)=>parts.find(p=>p.type===key)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function plannerWeek(timezone:string, now=new Date()): string[] {
  const day=new Date(`${plannerDate(timezone,now)}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
  return Array.from({length:7},(_,i)=>new Date(day.getTime()+i*86400000).toISOString().slice(0,10));
}
export function sunriseForDate(city:PlannerLocation, date:string): string|null {
  if (!validPlannerLocation(city) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  // Use the civil day, including cities across the date line (e.g. Samoa).
  const noon=Date.parse(`${date}T12:00:00Z`);
  const zone=new Intl.DateTimeFormat('en',{timeZone:city.timezone,timeZoneName:'longOffset'}).formatToParts(new Date(noon)).find(p=>p.type==='timeZoneName')!.value;
  const match=/GMT([+-])(\d{2}):(\d{2})/.exec(zone);
  const offset=match?(match[1]==='-'?-1:1)*(Number(match[2])*60+Number(match[3])):0;
  const anchor=new Date(noon-offset*60000);
  const sunrise=getTimes(anchor,city.latitude,city.longitude,0,offset).sunrise;
  if (!sunrise || !Number.isFinite(sunrise.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB',{timeZone:city.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(sunrise);
}
// Lazy local dataset: city searches and device coordinates never leave this browser.
const cityData=()=>import('city-timezones').then(m=>m.cityMapping || m.default.cityMapping);
const locationOf=(c:any):PlannerLocation=>({name:c.city,country:c.country,latitude:c.lat,longitude:c.lng,timezone:c.timezone});
export async function searchPlannerCities(query:string):Promise<PlannerLocation[]> {
  const words=query.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!words.length) return [];
  const data=await cityData();
  return data.filter(c=>words.every(w=>`${c.city} ${c.city_ascii} ${c.province} ${c.country}`.toLowerCase().includes(w)))
    .sort((a,b)=>b.pop-a.pop).map(locationOf).filter(validPlannerLocation).slice(0,12);
}
export async function nearestPlannerCity(latitude:number,longitude:number):Promise<PlannerLocation> {
  if (!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180) throw Error('Location is invalid. Choose a city manually.');
  const rad=Math.PI/180;
  const distance=(c:PlannerLocation)=>Math.sin((c.latitude-latitude)*rad/2)**2 + Math.cos(latitude*rad)*Math.cos(c.latitude*rad)*Math.sin((c.longitude-longitude)*rad/2)**2;
  const cities=(await cityData()).map(locationOf).filter(validPlannerLocation);
  return cities.reduce((best,c)=>distance(c)<distance(best)?c:best);
}
